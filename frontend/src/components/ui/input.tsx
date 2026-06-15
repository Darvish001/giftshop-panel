import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-lg shadow-black/10 backdrop-blur-xl ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/10",
                className
            )}
            ref={ref}
            {...props}
        />
    )
)
Input.displayName = "Input"

export { Input }
