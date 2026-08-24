import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-label text-xs font-semibold tracking-[0.08em] uppercase",
    "rounded-[var(--radius-control)]",
    "transition-[color,background-color,box-shadow,transform] duration-150",
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "glow-primary bg-accent text-ink-on-accent hover:bg-accent-hover active:bg-accent-pressed",
        secondary:
          "border border-accent bg-transparent text-accent hover:bg-accent-soft",
        ghost: "bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-accent",
        danger:
          "bg-danger text-surface-raised hover:bg-danger-hover active:bg-danger",
      },
      size: {
        sm: "h-9 px-3 [&_svg]:size-4",
        md: "h-10 px-4 [&_svg]:size-4",
        touch: "h-11 min-h-[44px] min-w-[44px] px-4 [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-5",
        iconTouch: "size-11 min-h-[44px] min-w-[44px] [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  loading,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="sr-only">...</span> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
