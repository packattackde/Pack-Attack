import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06061a] disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#BFFF00] text-black hover:shadow-[0_0_24px_rgba(191,255,0,0.3)] hover:scale-[1.02]",
        destructive:
          "bg-red-500/12 text-red-400 border border-red-500/25 hover:bg-red-500/20",
        outline:
          "border border-[rgba(191,255,0,0.3)] text-[#BFFF00] bg-transparent hover:bg-[rgba(191,255,0,0.08)] hover:border-[rgba(191,255,0,0.5)]",
        secondary:
          "bg-[rgba(255,255,255,0.04)] text-[#8888aa] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f0f0f5]",
        ghost:
          "text-[#8888aa] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f0f0f5]",
        link: "text-[#BFFF00] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2 min-w-[44px]",
        sm: "h-10 px-4 min-w-[44px] text-xs",
        lg: "h-12 px-8 min-w-[48px] text-base",
        icon: "h-11 w-11 min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

