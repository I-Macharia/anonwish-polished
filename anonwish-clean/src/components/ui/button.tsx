import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  outline: "border border-border bg-card hover:bg-muted",
  ghost: "hover:bg-muted",
  destructive: "bg-red-600 text-white hover:bg-red-700",
} as const;
type Variant = keyof typeof variants;

export const buttonStyles = (variant: Variant = "default", className?: string) =>
  cn(
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
    "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    variants[variant],
    className,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ className, variant = "default", type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={buttonStyles(variant, className)} {...props} />
  ),
);
Button.displayName = "Button";
