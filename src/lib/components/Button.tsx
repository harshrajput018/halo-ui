import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../hooks";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "solid" | "soft" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
};

/**
 * While `loading`, the button stays focusable (so focus isn't lost mid-action)
 * but is marked aria-busy + aria-disabled and ignores clicks.
 */
export function Button({ variant = "solid", size = "md", loading = false, icon, className, children, onClick, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-variant={variant}
      data-size={size}
      onClick={(e) => (loading ? e.preventDefault() : onClick?.(e))}
      className={cx("halo-btn", className)}
    >
      {loading ? <span className="halo-spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
