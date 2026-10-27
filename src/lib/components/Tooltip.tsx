import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePosition, type Placement } from "../hooks";

type TriggerProps = React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> };

/**
 * Tooltips are supplementary: the trigger must already have an accessible name.
 * Opens on hover (after a delay) and immediately on keyboard focus; Escape dismisses.
 */
export function Tooltip({ content, children, placement = "top", delay = 400 }: { content: ReactNode; children: ReactElement<TriggerProps>; placement?: Placement; delay?: number }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const { style, side } = usePosition(anchor, floating, open, placement, 8);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!isValidElement(children)) return children;

  const show = (wait: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };
  const p = children.props;

  return (
    <>
      {cloneElement(children, {
        ref: anchor,
        "aria-describedby": open ? [p["aria-describedby"], id].filter(Boolean).join(" ") : p["aria-describedby"],
        onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
          p.onPointerEnter?.(e);
          if (e.pointerType === "mouse") show(delay);
        },
        onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
          p.onPointerLeave?.(e);
          hide();
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          p.onFocus?.(e);
          show(0);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          p.onBlur?.(e);
          hide();
        },
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
          p.onPointerDown?.(e);
          hide();
        },
      })}
      {open &&
        createPortal(
          <div ref={floating} id={id} role="tooltip" className="halo-tooltip" data-side={side} style={style}>
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
