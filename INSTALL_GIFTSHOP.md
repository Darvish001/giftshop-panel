# GiftShop Panel Docker Compose Install

## One-command install from GitHub

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Darvish001/giftshop-panel/main/install.sh)
```

The installer creates `/opt/giftshop-panel`, downloads `docker-compose.yml` and `.env.example`, creates `.env`, pulls the Docker image and starts the service.

## Manual Docker Compose install

```bash
mkdir -p /opt/giftshop-panel/data
cd /opt/giftshop-panel
curl -fsSL https://raw.githubusercontent.com/Darvish001/giftshop-panel/main/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/Darvish001/giftshop-panel/main/.env.example -o .env
nano .env
docker compose up -d
```

## Default database

SQLite database file:

```text
/opt/giftshop-panel/data/gs.db
```

Inside the container:

```text
/app/data/gs.db
```

## CLI commands

```bash
giftshop-panel logs
giftshop-panel restart
giftshop-panel update
giftshop-panel backup
giftshop-panel edit-env
```
