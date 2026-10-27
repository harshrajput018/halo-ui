import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useControllableState, useDismiss, usePosition } from "../hooks";

export type Option = { value: string; label: string; hint?: string; disabled?: boolean };

export type ComboboxProps = {
  label: string;
  options: Option[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  hint?: string;
  emptyText?: string;
};

/** Editable combobox with list autocomplete (WAI-ARIA combobox pattern, aria-activedescendant). */
export function Combobox({ label, options, value, defaultValue = null, onChange, placeholder, hint, emptyText = "No results" }: ComboboxProps) {
  const [selected, setSelected] = useControllableState<string | null>({ value, defaultValue, onChange });
  const selectedOption = options.find((o) => o.value === selected) ?? null;
  const [query, setQuery] = useState<string | null>(null); // null = not typing, show the selected label
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const { style } = usePosition(wrapRef, listRef, open, "bottom-start", 4);

  const filtered = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const enabledIndex = (from: number, dir: 1 | -1) => {
    for (let k = 1; k <= filtered.length; k++) {
      const i = (from + dir * k + filtered.length * 2) % filtered.length;
      if (!filtered[i].disabled) return i;
    }
    return -1;
  };

  const openList = (startAt?: "selected" | "first" | "last") => {
    setOpen(true);
    const sel = filtered.findIndex((o) => o.value === selected);
    setActive(startAt === "last" ? enabledIndex(0, -1) : startAt === "selected" && sel >= 0 ? sel : enabledIndex(-1, 1));
  };

  const close = () => {
    setOpen(false);
    setQuery(null);
    setActive(-1);
  };

  const commit = (o: Option) => {
    if (o.disabled) return;
    setSelected(o.value);
    close();
    inputRef.current?.focus();
  };

  useDismiss([wrapRef, listRef], close, open);

  const activeId = open && active >= 0 && filtered[active] ? `${id}-opt-${active}` : undefined;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) return openList(e.altKey ? "selected" : "selected");
        setActive((a) => enabledIndex(a, 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!open) return openList("last");
        setActive((a) => enabledIndex(a, -1));
        return;
      case "Enter":
        if (open && active >= 0 && filtered[active]) {
          e.preventDefault();
          commit(filtered[active]);
        }
        return;
      case "Escape":
        // First Esc closes the list; a second clears the value
        if (open) {
          e.preventDefault();
          close();
        } else if (selected !== null) {
          e.preventDefault();
          setSelected(null);
        }
        return;
      case "Tab":
        if (open) close();
        return;
    }
  };

  return (
    <div className="halo-field">
      <label htmlFor={`${id}-input`} className="halo-label">
        {label}
      </label>
      <div ref={wrapRef} className="halo-combobox" data-open={open || undefined}>
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-describedby={hint ? `${id}-hint` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          className="halo-input"
          value={query ?? selectedOption?.label ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(e.target.value ? 0 : -1);
          }}
          onClick={() => (open ? close() : openList("selected"))}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (!listRef.current?.contains(e.relatedTarget as Node)) close();
          }}
        />
        <button type="button" tabIndex={-1} aria-label={open ? "Close options" : "Show options"} className="halo-combobox-toggle" onClick={() => (open ? close() : (openList("selected"), inputRef.current?.focus()))}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="halo-hint">
          {hint}
        </p>
      )}
      {open &&
        createPortal(
          <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} className="halo-listbox" style={style}>
            {filtered.length ? (
              filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={o.value === selected}
                  aria-disabled={o.disabled || undefined}
                  data-active={i === active || undefined}
                  className="halo-option"
                  onPointerDown={(e) => e.preventDefault()}
                  onPointerMove={() => !o.disabled && setActive(i)}
                  onClick={() => commit(o)}
                >
                  <span>{o.label}</span>
                  {o.hint && <span className="halo-option-hint">{o.hint}</span>}
                  {o.value === selected && (
                    <svg className="halo-option-check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              ))
            ) : (
              <li className="halo-empty" role="presentation">
                {emptyText}
              </li>
            )}
          </ul>,
          document.body,
        )}
      <span className="halo-sr-only" aria-live="polite">
        {open ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} available` : ""}
      </span>
    </div>
  );
}
