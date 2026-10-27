import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Supports both controlled (`value`) and uncontrolled (`defaultValue`) usage with one API. */
export function useControllableState<T>({ value, defaultValue, onChange }: { value?: T; defaultValue: T; onChange?: (v: T) => void }) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function focusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest("[inert], [hidden]"));
}

/** Keeps Tab / Shift+Tab inside `ref` while active, and puts focus back where it was on deactivate. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, initialFocus?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = initialFocus?.current ?? focusables(root)[0] ?? root;
    first.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables(root);
      if (!items.length) return e.preventDefault();
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === root)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, ref, initialFocus]);
}

/** Calls `onDismiss` on Escape or a pointer-down outside every ref. */
export function useDismiss(refs: RefObject<HTMLElement | null>[], onDismiss: () => void, active: boolean) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cb.current();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) cb.current();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

export type Placement = "top" | "bottom" | "bottom-start" | "bottom-end" | "top-start";

/** Places a floating element next to its anchor, flipping to the other side when it would overflow. */
export function usePosition(anchor: RefObject<HTMLElement | null>, floating: RefObject<HTMLElement | null>, open: boolean, placement: Placement = "bottom-start", offset = 6) {
  const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999 });
  const [side, setSide] = useState<"top" | "bottom">(placement.startsWith("top") ? "top" : "bottom");

  const update = useCallback(() => {
    const a = anchor.current?.getBoundingClientRect();
    const f = floating.current;
    if (!a || !f) return;
    const fw = f.offsetWidth;
    const fh = f.offsetHeight;
    let s: "top" | "bottom" = placement.startsWith("top") ? "top" : "bottom";
    if (s === "bottom" && a.bottom + offset + fh > window.innerHeight && a.top - offset - fh > 0) s = "top";
    else if (s === "top" && a.top - offset - fh < 0) s = "bottom";
    const top = s === "bottom" ? a.bottom + offset : a.top - offset - fh;
    let left = placement.endsWith("start") ? a.left : placement.endsWith("end") ? a.right - fw : a.left + a.width / 2 - fw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - fw - 8));
    setSide(s);
    setStyle({ position: "fixed", top, left, minWidth: placement.endsWith("start") ? a.width : undefined });
  }, [anchor, floating, placement, offset]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return { style, side };
}

/** Type-to-jump: returns a handler that finds the next label starting with the typed characters. */
export function useTypeahead(getLabels: () => string[], onMatch: (index: number) => void) {
  const buffer = useRef("");
  const timer = useRef<number | undefined>(undefined);
  return (key: string, from: number) => {
    if (key.length !== 1 || key === " ") return false;
    window.clearTimeout(timer.current);
    buffer.current += key.toLowerCase();
    timer.current = window.setTimeout(() => (buffer.current = ""), 500);
    const labels = getLabels().map((l) => l.toLowerCase());
    const q = buffer.current;
    // Repeating one letter cycles through matches
    const single = q.split("").every((c) => c === q[0]);
    const search = single ? q[0] : q;
    const order = [...labels.keys()].map((i) => (from + (single ? 1 : 0) + i) % labels.length);
    const hit = order.find((i) => labels[i].startsWith(search));
    if (hit !== undefined) onMatch(hit);
    return true;
  };
}

/** Locks page scroll while a modal is open, without layout shift from the disappearing scrollbar. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
    };
  }, [active]);
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
