import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    }

    const baseClassName = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
      variants[variant],
      sizes[size],
      className
    )

    const isDisabled = disabled || isLoading

    // asChild: clone the single child and merge classes/disabled state
    if (asChild) {
      const normalized = React.Children.toArray(children)
      const firstChild = normalized[0]

      if (!React.isValidElement(firstChild)) {
        return (
          <span className={baseClassName} aria-disabled={isDisabled || undefined} ref={ref as any} {...props}>
            {firstChild}
          </span>
        )
      }

      return React.cloneElement(firstChild, {
        className: cn(baseClassName, (firstChild.props as any).className),
        ref,
        "aria-disabled": isDisabled || undefined,
        ...props,
      })
    }

    // default: render native button
    return (
      <button
        className={baseClassName}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }

