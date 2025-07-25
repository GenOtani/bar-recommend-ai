import type * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default:
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground",
    secondary:
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground",
    destructive:
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-600 text-white",
    outline: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground",
  }

  return <div className={cn(variants[variant], className)} {...props} />
}

export { Badge }
