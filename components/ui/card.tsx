import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg transition-all",
  {
    variants: {
      variant: {
        default: "p-4",
        compact: "p-3",
      },
      interactive: {
        true: "cursor-pointer hover:border-primary-300 hover:shadow-md",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
)

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>

function Card({ className, variant, interactive, onClick, ...props }: CardProps) {
  const isInteractive = interactive && onClick

  return (
    <div
      className={cn(cardVariants({ variant, interactive }), className)}
      onClick={onClick}
      {...(isInteractive ? { role: "button", tabIndex: 0 } : {})}
      {...props}
    />
  )
}

export { Card, cardVariants }
export type { CardProps }
