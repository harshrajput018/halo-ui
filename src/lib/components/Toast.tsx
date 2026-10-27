import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
  action?: { label: string; onClick: () => void };
  /** ms before auto-dismiss; 0 keeps it until closed. Errors default to 0. */
  duration?: number;
};
type ToastItem = ToastOptions & { id: number };

const ToastContext = createContext<((t: ToastOptions) => number) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 1;

/** Renders a live region; F8 jumps keyboard focus to the newest toast. */
export function ToastProvider({ children, max = 3 }: { children: ReactNode; max?: number }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const regionRef = useRef<HTMLOListElement>(null);

  const toast = useCallback(
    (t: ToastOptions) => {
      const id = nextId++;
      setToasts((list) => [...list, { ...t, id }].slice(-max));
      return id;
    },
    [max],
  );
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F8") {
        const last = regionRef.current?.querySelector<HTMLElement>("li:last-child");
        if (last) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <section aria-label="Notifications (F8)" className="halo-toast-region">
          <ol ref={regionRef} className="halo-toast-list">
            {toasts.map((t) => (
              <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </ol>
        </section>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const duration = toast.duration ?? (toast.variant === "error" ? 0 : 5000);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const started = useRef(0);

  // Pausable countdown: hovering or focusing the toast stops the clock
  useEffect(() => {
    if (!duration || paused) return;
    started.current = Date.now();
    const t = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, duration, onDismiss]);

  return (
    <li
      role={toast.variant === "error" ? "alert" : "status"}
      aria-atomic="true"
      tabIndex={-1}
      data-variant={toast.variant ?? "default"}
      className="halo-toast"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      onKeyDown={(e) => e.key === "Escape" && onDismiss()}
    >
      <div className="halo-toast-text">
        <p className="halo-toast-title">{toast.title}</p>
        {toast.description && <p className="halo-toast-desc">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          className="halo-btn"
          data-variant="soft"
          data-size="sm"
          onClick={() => {
            toast.action!.onClick();
            onDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="halo-toast-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {duration > 0 && <span className="halo-toast-timer" style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? "paused" : "running" }} aria-hidden="true" />}
    </li>
  );
}
