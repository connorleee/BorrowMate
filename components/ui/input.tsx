import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--bg-base)] text-[var(--text-primary)]",
  {
    variants: {
      inputSize: {
        sm: "px-2.5 py-1.5 text-sm",
        md: "px-3 py-2 text-sm",
        lg: "p-3 text-base",
      },
      error: {
        true: "border-error-500 focus:ring-error-500",
        false: "border-[var(--border)] focus:ring-primary-500",
      },
    },
    defaultVariants: {
      inputSize: "md",
      error: false,
    },
  }
)

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants> & {
    label?: string
    errorMessage?: string
  }

function Input({
  className,
  inputSize,
  error,
  label,
  errorMessage,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")
  const hasError = error || !!errorMessage

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(inputVariants({ inputSize, error: hasError }), className)}
        {...props}
      />
      {errorMessage && (
        <p className="text-sm text-error-500">{errorMessage}</p>
      )}
    </div>
  )
}

export { Input }
