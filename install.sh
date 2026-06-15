#!/bin/bash

set -e

INSTALL_DIR="/opt/giftshop-panel"
REPO_URL="${REPO_URL:-https://raw.githubusercontent.com/Darvish001/giftshop-panel/main}"
DOCKER_IMAGE="${DOCKER_IMAGE:-darvish021/giftshop-panel:latest}"
CLI_NAME="giftshop-panel"

print_status() { echo "[*] $1"; }
print_success() { echo -e "\033[32m[OK] $1\033[0m"; }
print_error() { echo -e "\033[31m[ERROR] $1\033[0m"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

install_dependencies() {
    print_status "Installing required packages..."
    apt-get update
    apt-get install -y curl openssl ca-certificates nano ufw nginx certbot python3-certbot-nginx
    systemctl enable nginx >/dev/null 2>&1 || true
    systemctl start nginx >/dev/null 2>&1 || true
}

install_docker() {
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker is already installed"
    else
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
        print_success "Docker installed successfully"
    fi

    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose plugin is not available. Please install docker-compose-plugin and run again."
        exit 1
    fi
}

setup_directory() {
    print_status "Setting up installation directory..."
    mkdir -p "$INSTALL_DIR/data"
    cd "$INSTALL_DIR"
    print_success "Directory ready: $INSTALL_DIR"
}

download_files() {
    print_status "Downloading Docker Compose and environment files..."
    curl -fsSL "$REPO_URL/docker-compose.yml" -o docker-compose.yml
    curl -fsSL "$REPO_URL/.env.example" -o .env.example
    print_success "Files downloaded"
}

set_env_value() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

configure_env() {
    print_status "Configuring GiftShop Panel..."
    echo ""

    read -p "Enter owner username [admin]: " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}

    read -sp "Enter owner password [admin]: " ADMIN_PASS
    ADMIN_PASS=${ADMIN_PASS:-admin}
    echo ""

    read -p "Enter internal app port inside Docker [8000]: " APP_PORT
    APP_PORT=${APP_PORT:-8000}

    read -p "Enter Docker proxy/local port [8000]: " PUBLISH_PORT
    PUBLISH_PORT=${PUBLISH_PORT:-8000}

    read -p "Enter URL path [giftshop]: " URL_PATH
    URL_PATH=${URL_PATH:-giftshop}

    read -p "Do you want automatic SSL with Certbot and Nginx? [Y/n]: " SSL_CHOICE
    SSL_CHOICE=${SSL_CHOICE:-Y}

    DOMAIN=""
    EMAIL=""
    ENABLE_SSL="False"
    BIND_HOST="0.0.0.0"

    if [[ "$SSL_CHOICE" =~ ^[Yy]$ ]]; then
        ENABLE_SSL="True"
        BIND_HOST="127.0.0.1"
        read -p "Enter domain for SSL, example panel.example.com: " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            print_error "Domain is required for SSL mode."
            exit 1
        fi
        read -p "Enter email for Let's Encrypt [admin@$DOMAIN]: " EMAIL
        EMAIL=${EMAIL:-admin@$DOMAIN}
    fi

    JWT_SECRET=$(openssl rand -hex 32)

    cp .env.example .env

    set_env_value "ADMIN_USERNAME" "$ADMIN_USER"
    set_env_value "ADMIN_PASSWORD" "$ADMIN_PASS"
    set_env_value "HOST" "0.0.0.0"
    set_env_value "PORT" "$APP_PORT"
    set_env_value "PUBLISH_PORT" "$PUBLISH_PORT"
    set_env_value "BIND_HOST" "$BIND_HOST"
    set_env_value "URLPATH" "$URL_PATH"
    set_env_value "DOMAIN" "$DOMAIN"
    set_env_value "ENABLE_SSL" "$ENABLE_SSL"
    set_env_value "CERTBOT_EMAIL" "$EMAIL"
    set_env_value "JWT_SECRET_KEY" "\"$JWT_SECRET\""

    # SSL is terminated by Nginx, not Uvicorn inside Docker.
    sed -i 's|^SSL_KEYFILE=.*|# SSL_KEYFILE=|' .env || true
    sed -i 's|^SSL_CERTFILE=.*|# SSL_CERTFILE=|' .env || true

    print_success "Configuration saved to $INSTALL_DIR/.env"
}

configure_nginx_ssl() {
    cd "$INSTALL_DIR"
    local DOMAIN=$(grep "^DOMAIN=" .env | cut -d'=' -f2-)
    local ENABLE_SSL=$(grep "^ENABLE_SSL=" .env | cut -d'=' -f2-)
    local PUBLISH_PORT=$(grep "^PUBLISH_PORT=" .env | cut -d'=' -f2-)
    local URL_PATH=$(grep "^URLPATH=" .env | cut -d'=' -f2-)
    local EMAIL=$(grep "^CERTBOT_EMAIL=" .env | cut -d'=' -f2-)

    if [[ "$ENABLE_SSL" != "True" ]]; then
        print_status "SSL mode disabled. Skipping Nginx/Certbot setup."
        return
    fi

    print_status "Configuring Nginx reverse proxy for $DOMAIN..."
    cat > "/etc/nginx/sites-available/giftshop-panel.conf" <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PUBLISH_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

    ln -sf /etc/nginx/sites-available/giftshop-panel.conf /etc/nginx/sites-enabled/giftshop-panel.conf
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx

    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true

    print_status "Requesting Let's Encrypt certificate..."
    if [[ -z "$EMAIL" ]]; then
        EMAIL="admin@$DOMAIN"
    fi
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

    print_success "SSL enabled for https://$DOMAIN/$URL_PATH/login"
}

install_command() {
    cat > /usr/local/bin/$CLI_NAME <<'CLISCRIPT'
#!/bin/bash
set -e
cd /opt/giftshop-panel

case "$1" in
    edit-env)
        nano .env
        ;;
    update)
        echo "Updating GiftShop Panel..."
        docker compose pull
        docker compose up -d
        echo "Update complete!"
        docker compose logs -f
        ;;
    start)
        docker compose up -d
        echo "GiftShop Panel started"
        ;;
    stop)
        docker compose down
        echo "GiftShop Panel stopped"
        ;;
    restart)
        docker compose restart
        echo "GiftShop Panel restarted"
        docker compose logs -f
        ;;
    logs)
        docker compose logs -f
        ;;
    renew-ssl)
        certbot renew
        systemctl reload nginx || true
        echo "SSL renewal checked"
        ;;
    backup)
        mkdir -p backups
        cp ./data/gs.db "./backups/gs-$(date +%Y%m%d-%H%M%S).db" 2>/dev/null || true
        echo "Backup saved in /opt/giftshop-panel/backups"
        ;;
    uninstall)
        docker compose down
        rm -f /etc/nginx/sites-enabled/giftshop-panel.conf /etc/nginx/sites-available/giftshop-panel.conf
        systemctl reload nginx || true
        rm -rf /opt/giftshop-panel
        rm -f /usr/local/bin/giftshop-panel
        echo "GiftShop Panel uninstalled"
        ;;
    *)
        echo "Usage: giftshop-panel {edit-env|update|start|stop|restart|logs|renew-ssl|backup|uninstall}"
        ;;
esac
CLISCRIPT
    chmod +x /usr/local/bin/$CLI_NAME
    print_success "CLI installed: $CLI_NAME"
}

pull_and_run() {
    print_status "Pulling Docker image: $DOCKER_IMAGE"
    docker pull "$DOCKER_IMAGE"

    print_status "Starting GiftShop Panel with Docker Compose..."
    docker compose up -d
    configure_nginx_ssl
    show_info
}

show_info() {
    local PANEL_PORT=$(grep "^PUBLISH_PORT=" .env | cut -d'=' -f2)
    local URL_PATH=$(grep "^URLPATH=" .env | cut -d'=' -f2)
    local DOMAIN=$(grep "^DOMAIN=" .env | cut -d'=' -f2-)
    local ENABLE_SSL=$(grep "^ENABLE_SSL=" .env | cut -d'=' -f2-)
    local IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

    echo ""
    echo "========================================"
    echo "   GiftShop Panel installation complete"
    echo "========================================"
    echo ""
    if [[ "$ENABLE_SSL" == "True" && -n "$DOMAIN" ]]; then
        echo -e "\033[32m  Panel URL: https://$DOMAIN/$URL_PATH/login\033[0m"
    else
        echo -e "\033[32m  Panel URL: http://$IP:$PANEL_PORT/$URL_PATH/login\033[0m"
    fi
    echo ""
    echo "  Commands:"
    echo "    giftshop-panel edit-env"
    echo "    giftshop-panel update"
    echo "    giftshop-panel start"
    echo "    giftshop-panel stop"
    echo "    giftshop-panel restart"
    echo "    giftshop-panel logs"
    echo "    giftshop-panel renew-ssl"
    echo "    giftshop-panel backup"
    echo ""
}

main() {
    echo "GiftShop Panel Installer"
    echo ""
    check_root
    install_dependencies
    install_docker
    setup_directory
    download_files
    configure_env
    install_command
    pull_and_run
}

main
