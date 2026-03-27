import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Kaleidorium Button – 3 canonical variants
 *
 * default          → Primary CTA  (dark #1E1E1C bg, white text)
 * outline          → Secondary soft (lilac #F3EDFF bg, lilac border/text) — "signature" elegant action
 * ghost            → Ghost / utility (white bg, neutral border) — nav & low-emphasis
 *
 * All other shadcn variants (destructive, secondary, link) kept for compatibility.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // ── A. Primary CTA ──────────────────────────────────
        default:
          "bg-[#1E1E1C] text-white border-transparent shadow-sm " +
          "hover:bg-[#2d2d2b] active:scale-[0.97] transition-all",

        // ── B. Secondary soft (signature lilac) ─────────────
        outline:
          "bg-[#F3EDFF] border border-[#D9CFF7] text-[#3F3566] shadow-sm " +
          "hover:brightness-95 active:scale-[0.97] transition-all",

        // ── C. Ghost / outline utility ───────────────────────
        ghost:
          "bg-transparent border-transparent text-[#1E1E1C] " +
          "hover:bg-[#FAFAF8] active:scale-[0.97] transition-all",

        // ── Kept for compatibility ───────────────────────────
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        secondary:
          "bg-[#FAFAF8] border border-[#E6E4DF] text-[#1E1E1C] shadow-sm " +
          "hover:bg-[#F0EDE8] active:scale-[0.97] transition-all",
        link:
          "text-[#3F3566] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 py-2",   /* 48px – standard action button */
        sm:      "h-9  px-4 py-1.5 text-sm rounded-lg",
        lg:      "h-14 px-8 py-2 text-lg",
        icon:    "h-10 w-10",
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
