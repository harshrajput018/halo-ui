import { useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap, useScrollLock } from "../hooks";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Element to focus when the dialog opens. Defaults to the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** "alertdialog" for destructive confirmations: no outside-click dismiss. */
  role?: "dialog" | "alertdialog";
  size?: "sm" | "md" | "lg";
};

export function Dialog({ open, onOpenChange, title, description, children, footer, initialFocus, role = "dialog", size = "md" }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(ref, open, initialFocus);
  useScrollLock(open);

  if (!open) return null;

  return createPortal(
    <div
      className="halo-overlay"
      data-state="open"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && role === "dialog") onOpenChange(false);
      }}
    >
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        data-size={size}
        className="halo-dialog"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onOpenChange(false);
          }
        }}
      >
        <h2 id={titleId} className="halo-dialog-title">
          {title}
        </h2>
        {description && (
          <p id={descId} className="halo-dialog-desc">
            {description}
          </p>
        )}
        {children && <div className="halo-dialog-body">{children}</div>}
        {footer && <div className="halo-dialog-footer">{footer}</div>}
        <button type="button" className="halo-dialog-close" aria-label="Close" onClick={() => onOpenChange(false)}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
