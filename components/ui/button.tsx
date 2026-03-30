import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Kaleidorium Button – 3 canonical variants
 *
 * default   → Primary CTA  (#1E1E1C bg, white text) — form submits, main actions
 * outline   → Secondary soft (lilac bg/border/text) — "signature" elegant action
 * ghost     → Ghost / utility (white bg, neutral border) — nav & low-emphasis
 * secondary → Neutral soft (off-white bg, border) — kept for compatibility
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // ── A. Primary CTA ─────────────────────────────────
        // Dark bg / white text — form submits, hard CTAs
        default:
          "bg-[#1E1E1C] text-white border border-transparent text-[15px] " +
          "hover:bg-[#2d2d2b] active:scale-[0.97]",

        // ── B. Signature branded secondary (default premium CTA) ─
        // Soft lilac — "View artwork", "Get Started", most hero CTAs
        outline:
          "bg-[#F5F0FF] border border-[#D9CFF7] text-[#4F4564] text-[15px] " +
          "hover:brightness-[0.97] active:scale-[0.97]",

        // ── C. Ghost / neutral ───────────────────────────────
        // White bg + subtle border — nav, low-emphasis, icon wrappers
        ghost:
          "bg-white border border-[#E6E4DF] text-[#1E1E1C] text-[14px] " +
          "hover:bg-[#FAFAF8] active:scale-[0.97]",

        // ── Neutral soft (compat alias for secondary) ────────
        secondary:
          "bg-[#FAFAF8] border border-[#E6E4DF] text-[#1E1E1C] text-[14px] " +
          "hover:bg-[#F0EDE8] active:scale-[0.97]",

        // ── Destructive (compat) ─────────────────────────────
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        link:
          "text-[#4F4564] underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-11 px-5 py-2 [&_svg]:size-4",   /* 44px — refined primary */
        sm:      "h-9 px-4 py-1.5 text-sm rounded-[10px] [&_svg]:size-3.5", /* 36px compact */
        lg:      "h-12 px-8 py-2 text-base [&_svg]:size-5",
        icon:    "h-9 w-9 [&_svg]:size-4 border-transparent bg-transparent hover:bg-[#FAFAF8]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
