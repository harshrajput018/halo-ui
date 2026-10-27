import { cloneElement, createContext, isValidElement, useContext, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDismiss, usePosition, useTypeahead, type Placement } from "../hooks";

type Ctx = {
  open: boolean;
  setOpen: (open: boolean, focus?: "first" | "last") => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  menuId: string;
  triggerId: string;
  initialFocus: React.RefObject<"first" | "last">;
};
const MenuContext = createContext<Ctx | null>(null);
const useMenu = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("Menu components must be used inside <Menu>");
  return ctx;
};

export function Menu({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialFocus = useRef<"first" | "last">("first");
  const menuId = useId();
  const triggerId = useId();
  const setOpen = (next: boolean, focus: "first" | "last" = "first") => {
    initialFocus.current = focus;
    setOpenState(next);
  };
  return <MenuContext.Provider value={{ open, setOpen, triggerRef, contentRef, menuId, triggerId, initialFocus }}>{children}</MenuContext.Provider>;
}

/** Wraps a single button child and gives it the menu-button semantics. */
export function MenuTrigger({ children }: { children: ReactElement<React.ComponentPropsWithRef<"button">> }) {
  const { open, setOpen, triggerRef, menuId, triggerId } = useMenu();
  if (!isValidElement(children)) throw new Error("MenuTrigger expects one element child");
  return cloneElement(children, {
    ref: triggerRef,
    id: triggerId,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      children.props.onClick?.(e);
      setOpen(!open);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
      children.props.onKeyDown?.(e);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true, e.key === "ArrowUp" ? "last" : "first");
      }
    },
  });
}

export function MenuContent({ children, placement = "bottom-start", "aria-label": label }: { children: ReactNode; placement?: Placement; "aria-label"?: string }) {
  const { open, setOpen, triggerRef, contentRef, menuId, triggerId, initialFocus } = useMenu();
  const { style } = usePosition(triggerRef, contentRef, open, placement);
  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  useDismiss([triggerRef, contentRef], () => close(false), open);

  const items = () => [...(contentRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])];
  const typeahead = useTypeahead(
    () => items().map((el) => el.textContent ?? ""),
    (i) => items()[i]?.focus(),
  );

  useLayoutEffect(() => {
    if (!open) return;
    const list = items();
    (initialFocus.current === "last" ? list[list.length - 1] : list[0])?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      list[(to + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") return move(i + 1);
    if (e.key === "ArrowUp") return move(i - 1);
    if (e.key === "Home") return move(0);
    if (e.key === "End") return move(list.length - 1);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      return close();
    }
    if (e.key === "Tab") return close(false);
    if (typeahead(e.key, i)) e.preventDefault();
  };

  return createPortal(
    <div ref={contentRef} role="menu" id={menuId} aria-labelledby={label ? undefined : triggerId} aria-label={label} className="halo-menu" style={style} onKeyDown={onKeyDown}>
      <MenuCloseContext.Provider value={close}>{children}</MenuCloseContext.Provider>
    </div>,
    document.body,
  );
}

const MenuCloseContext = createContext<(returnFocus?: boolean) => void>(() => {});

export function MenuItem({ children, onSelect, disabled, shortcut, danger, icon }: { children: ReactNode; onSelect?: () => void; disabled?: boolean; shortcut?: string; danger?: boolean; icon?: ReactNode }) {
  const close = useContext(MenuCloseContext);
  const activate = () => {
    if (disabled) return;
    close();
    onSelect?.();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      data-danger={danger || undefined}
      className="halo-menuitem"
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      onPointerMove={(e) => !disabled && e.currentTarget.focus({ preventScroll: true })}
    >
      {icon && <span className="halo-menuitem-icon" aria-hidden="true">{icon}</span>}
      <span className="halo-menuitem-label">{children}</span>
      {shortcut && <kbd className="halo-kbd" aria-hidden="true">{shortcut}</kbd>}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="halo-menu-sep" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div role="presentation" className="halo-menu-label">
      {children}
    </div>
  );
}
