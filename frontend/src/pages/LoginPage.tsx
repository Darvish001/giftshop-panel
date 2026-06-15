import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/types'
import { authAPI } from '@/lib/api'
import { setToken, getDecodedToken, isTokenValid } from '@/lib/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logo from '@/assets/logo.png'
import background from '@/assets/background.jpg'
import {
    AlertCircle,
    Loader2,
    User,
    Lock,
} from 'lucide-react'

export function LoginPage() {
    const navigate = useNavigate()
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
        if (isTokenValid()) {
            navigate('/', { replace: true })
        }
    }, [navigate])

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null)

        try {
            const response = await authAPI.login(
                data.username,
                data.password
            )

            setToken(response.access_token)

            const decoded = getDecodedToken()

            if (decoded?.role) {
                navigate('/', { replace: true })
            } else {
                setServerError('Failed to determine user role')
            }
        } catch (error: any) {
            if (error?.response?.status === 401) {
                setServerError('Incorrect username or password')
                return
            }

            setServerError(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to login. Please check your credentials.'
            )
        }
    }

    return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">

        {/* Background Image */}
        <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `url(${background})`,
            }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Glow Effects */}
        <div className="absolute inset-0">
            <div className="absolute left-[-200px] top-[-200px] h-[500px] w-[500px] rounded-full bg-red-600/20 blur-[180px]" />
            <div className="absolute right-[-200px] bottom-[-200px] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[180px]" />
        </div>

        {/* Grid */}
        <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
            }}
        />

        <div className="relative z-10 w-full max-w-md">

            {/* Logo */}
            <div className="mb-10 text-center">

                <div className="relative mx-auto mb-8 flex justify-center">

                    <div className="absolute h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />

                    <img
                        src={logo}
                        alt="GS Logo"
                        className="
                            relative
                            w-[320px]
                            md:w-[420px]
                            object-contain
                            drop-shadow-[0_0_60px_rgba(255,0,80,.9)]
                            transition-all
                            duration-500
                        "
                    />
                </div>

                <h1 className="bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-5xl font-black tracking-wide text-transparent">
                    GIFT SHOP
                </h1>

                <p className="mt-3 text-sm uppercase tracking-[0.3em] text-zinc-300">
                    Administration Panel
                </p>
            </div>

            {/* Login Card */}
            <div className="rounded-[28px] border border-white/10 bg-black/40 p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(168,85,247,.25)] ring-1 ring-purple-500/25">

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-white">
                        Welcome Back
                    </h2>

                    <p className="mt-2 text-zinc-400">
                        Sign in to access your management dashboard
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                >
                    {serverError && (
                        <div className="flex rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                            <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <div>
                        <Label className="mb-2 block text-zinc-300">
                            Username
                        </Label>

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                            <Input
                                {...register('username')}
                                disabled={isSubmitting}
                                placeholder="Enter username"
                                className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 backdrop-blur-xl focus:border-fuchsia-400 focus:ring-fuchsia-400/30"
                            />
                        </div>

                        {errors.username && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.username.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="mb-2 block text-zinc-300">
                            Password
                        </Label>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                            <Input
                                {...register('password')}
                                type="password"
                                disabled={isSubmitting}
                                placeholder="Enter password"
                                className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 backdrop-blur-xl focus:border-fuchsia-400 focus:ring-fuchsia-400/30"
                            />
                        </div>

                        {errors.password && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="
                            h-12
                            w-full
                            border-0
                            font-semibold
                            text-white
                            bg-gradient-to-r
                            from-fuchsia-600
                            via-orange-500
                            to-yellow-400
                            shadow-[0_0_35px_rgba(255,120,60,.45)]
                            transition-all
                            duration-300
                            hover:scale-[1.02]
                        "
                    >
                        {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        {isSubmitting
                            ? 'Authenticating...'
                            : 'Login To Dashboard'}
                    </Button>
                </form>

                <div className="mt-8 border-t border-white/10 pt-4 text-center">
                    <p className="text-xs tracking-wider text-zinc-500">
                        GIFT SHOP MANAGEMENT SYSTEM • SECURE ACCESS
                    </p>
                </div>

            </div>
        </div>
    </div>
)
}