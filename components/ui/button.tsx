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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // ── A. Primary CTA ──────────────────────────────────
        default:
          "bg-[#1E1E1C] text-white border-transparent shadow-sm text-[15px] " +
          "hover:bg-[#2d2d2b] active:scale-[0.97]",

        // ── B. Secondary soft (signature lilac) ─────────────
        outline:
          "bg-[#F3EDFF] border border-[#D9CFF7] text-[#3F3566] shadow-sm text-[15px] " +
          "hover:brightness-95 active:scale-[0.97]",

        // ── C. Ghost / outline utility ───────────────────────
        ghost:
          "bg-transparent border-transparent text-[#1E1E1C] text-[14px] " +
          "hover:bg-[#FAFAF8] active:scale-[0.97]",

        // ── Neutral soft (compat) ────────────────────────────
        secondary:
          "bg-[#FAFAF8] border border-[#E6E4DF] text-[#1E1E1C] shadow-sm text-[14px] " +
          "hover:bg-[#F0EDE8] active:scale-[0.97]",

        // ── Destructive (compat) ─────────────────────────────
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",

        link:
          "text-[#3F3566] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 py-2 [&_svg]:size-4",   /* 48px desktop */
        sm:      "h-10 px-4 py-1.5 text-sm rounded-lg [&_svg]:size-4",  /* 40px compact */
        lg:      "h-12 px-8 py-2 text-base [&_svg]:size-5",
        icon:    "h-10 w-10 [&_svg]:size-4",
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
