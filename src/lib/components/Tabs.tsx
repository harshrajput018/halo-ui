import { createContext, useContext, useId, useRef, type ReactNode } from "react";
import { cx, useControllableState } from "../hooks";

type Ctx = {
  value: string;
  select: (v: string) => void;
  baseId: string;
  activation: "automatic" | "manual";
  orientation: "horizontal" | "vertical";
};
const TabsContext = createContext<Ctx | null>(null);
const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used inside <Tabs>");
  return ctx;
};
const safe = (v: string) => v.replace(/[^\w-]/g, "_");

export type TabsProps = {
  value?: string;
  defaultValue: string;
  onValueChange?: (v: string) => void;
  /** "manual": arrows move focus, Enter/Space selects. Use when panels are expensive to render. */
  activation?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  children: ReactNode;
  className?: string;
};

export function Tabs({ value, defaultValue, onValueChange, activation = "automatic", orientation = "horizontal", children, className }: TabsProps) {
  const [current, select] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value: current, select, baseId, activation, orientation }}>
      <div className={cx("halo-tabs", className)} data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, "aria-label": label }: { children: ReactNode; "aria-label": string }) {
  const { orientation, activation, select } = useTabs();
  const ref = useRef<HTMLDivElement>(null);

  // Roving focus: only the selected tab is in the Tab order; arrows move between tabs
  const onKeyDown = (e: React.KeyboardEvent) => {
    const tabs = [...ref.current!.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')];
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const prev = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    let target: number | null = null;
    if (e.key === next) target = (i + 1) % tabs.length;
    else if (e.key === prev) target = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = tabs.length - 1;
    if (target === null) return;
    e.preventDefault();
    tabs[target].focus();
    if (activation === "automatic") select(tabs[target].dataset.value!);
  };

  return (
    <div ref={ref} role="tablist" aria-label={label} aria-orientation={orientation} className="halo-tablist" onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

export function Tab({ value, children, disabled }: { value: string; children: ReactNode; disabled?: boolean }) {
  const { value: current, select, baseId } = useTabs();
  const selected = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${safe(value)}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${safe(value)}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      data-value={value}
      className="halo-tab"
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { value: current, baseId } = useTabs();
  if (current !== value) return null;
  return (
    <div role="tabpanel" id={`${baseId}-panel-${safe(value)}`} aria-labelledby={`${baseId}-tab-${safe(value)}`} tabIndex={0} className="halo-tabpanel">
      {children}
    </div>
  );
}
