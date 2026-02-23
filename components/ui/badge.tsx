import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium",
  {
    variants: {
      variant: {
        success:
          "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200",
        error:
          "bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200",
        warning:
          "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200",
        info:
          "bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200",
        neutral:
          "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  }
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
