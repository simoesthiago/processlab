import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-muted text-muted-foreground",
      destructive: "bg-destructive/10 text-destructive border-destructive/20",
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 shadow-sm transition-all duration-200",
          variants[variant],
          className
        )}
        {...props}
      >
        {variant === "destructive" && (
          <AlertCircle className="h-4 w-4 absolute top-4 left-4" />
        )}
        <div className={variant === "destructive" ? "pl-7" : ""}>
          {children}
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert }

