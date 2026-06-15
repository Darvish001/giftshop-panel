import { useLocation, useNavigate } from 'react-router-dom'
import {
    BarChart3,
    Users,
    Settings,
    LogOut,
    Server,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout, getUserRole } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface SidebarProps {
    onItemClick?: () => void
}

const navigationItems = [
    {
        label: 'Dashboard',
        href: '/',
        icon: BarChart3,
        roles: ['admin', 'superadmin'],
    },
    {
        label: 'Admins',
        href: '/admins',
        icon: Users,
        roles: ['superadmin'],
    },
    {
        label: 'Panels',
        href: '/panels',
        icon: Server,
        roles: ['superadmin'],
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['superadmin'],
    },
]


export function Sidebar({ onItemClick }: SidebarProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const userRole = getUserRole()

    const filteredItems = navigationItems.filter(item =>
        userRole && item.roles.includes(userRole)
    )

    const handleLogout = () => {
        logout()
    }

    return (
        <div className="flex flex-col h-full">
            <nav className="flex-1 space-y-2 p-4">
                {filteredItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href

                    return (
                        <Button
                            key={item.href}
                            variant={isActive ? 'default' : 'ghost'}
                            className={cn(
                                'w-full justify-start gap-3 rounded-xl border border-white/15 bg-transparent text-white shadow-none backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-gradient-to-r hover:from-fuchsia-600 hover:via-orange-500 hover:to-yellow-400 hover:text-white hover:shadow-[0_0_30px_rgba(255,120,60,.35)]',
                                isActive && 'border-white/25 bg-gradient-to-r from-fuchsia-600 via-orange-500 to-yellow-400 text-white shadow-[0_0_35px_rgba(255,120,60,.42)] hover:from-fuchsia-600 hover:via-orange-500 hover:to-yellow-400 hover:text-white'
                            )}
                            onClick={() => {
                                navigate(item.href)
                                onItemClick?.()
                            }}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Button>
                    )
                })}
            </nav>

            <div className="border-t p-4 space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-white hover:text-white hover:bg-white/10"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </Button>

                <div className="w-full rounded-md px-4 py-2 text-sm font-medium text-white/70 flex items-center gap-3 select-none">
                    <span className="h-4 w-4 inline-flex items-center justify-center text-xs">v</span>
                    <span>ver 1.0</span>
                </div>
            </div>
        </div>
    )
}
