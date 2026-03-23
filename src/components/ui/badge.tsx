import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#BFFF00] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(191,255,0,0.3)] bg-[rgba(191,255,0,0.1)] text-[#BFFF00]",
        secondary:
          "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[#8888aa]",
        destructive:
          "border-red-500/30 bg-red-500/12 text-red-400",
        outline:
          "border-[rgba(255,255,255,0.12)] text-[#f0f0f5]",
        success:
          "border-green-500/30 bg-green-500/12 text-green-400",
        warning:
          "border-yellow-500/30 bg-yellow-500/12 text-yellow-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }


