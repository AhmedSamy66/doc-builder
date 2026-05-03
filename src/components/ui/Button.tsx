import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./styles";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClassNames: Record<ButtonVariant, string> = {
  danger:
    "border border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-950/15 enabled:hover:bg-rose-700 focus:ring-rose-500/20",
  ghost:
    "border border-transparent bg-transparent text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-950 focus:ring-slate-500/10",
  primary:
    "border border-blue-600 bg-linear-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/20 enabled:hover:from-blue-500 enabled:hover:to-indigo-700 enabled:hover:shadow-xl enabled:hover:shadow-blue-950/25 focus:ring-blue-500/20",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-950/5 enabled:hover:border-slate-300 enabled:hover:bg-slate-50 focus:ring-slate-500/10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      disabled,
      isLoading = false,
      leftIcon,
      rightIcon,
      type = "button",
      variant = "primary",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200 focus:ring-4 enabled:cursor-pointer enabled:active:scale-[0.99] enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
          variantClassNames[variant],
          className,
        )}
        disabled={isDisabled}
        ref={ref}
        type={type}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : leftIcon ? (
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center"
          >
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {rightIcon && !isLoading ? (
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center"
          >
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  },
);
