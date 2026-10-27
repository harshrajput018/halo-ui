import { useEffect, useId, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx, useControllableState } from "../hooks";

export type SwitchProps = {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  description?: ReactNode;
};

export function Switch({ label, checked, defaultChecked = false, onCheckedChange, disabled, description }: SwitchProps) {
  const [on, setOn] = useControllableState({ value: checked, defaultValue: defaultChecked, onChange: onCheckedChange });
  const id = useId();
  return (
    <div className="halo-choice">
      <button type="button" role="switch" id={id} aria-checked={on} aria-describedby={description ? `${id}-d` : undefined} disabled={disabled} className="halo-switch" onClick={() => setOn(!on)}>
        <span className="halo-switch-thumb" aria-hidden="true" />
      </button>
      <div>
        <label htmlFor={id} className="halo-choice-label">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="halo-hint">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & { label: ReactNode; indeterminate?: boolean; description?: ReactNode };

/** Native checkbox underneath (forms, autofill and screen readers just work), custom visuals on top. */
export function Checkbox({ label, indeterminate = false, description, className, id: idProp, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const auto = useId();
  const id = idProp ?? auto;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <div className={cx("halo-choice", className)}>
      <span className="halo-checkbox">
        <input ref={ref} type="checkbox" id={id} aria-describedby={description ? `${id}-d` : undefined} {...rest} />
        <svg viewBox="0 0 16 16" aria-hidden="true">
          {indeterminate ? <path d="M4 8h8" /> : <path d="M3.5 8.5l3 3 6-6.5" />}
        </svg>
      </span>
      <div>
        <label htmlFor={id} className="halo-choice-label">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="halo-hint">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export type TextFieldProps = ComponentPropsWithoutRef<"input"> & { label: string; hint?: string; error?: string };

/** Label, hint and error wired up with ids so assistive tech reads them together. */
export function TextField({ label, hint, error, id: idProp, className, required, ...rest }: TextFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("halo-field", className)}>
      <label htmlFor={id} className="halo-label">
        {label}
        {required && (
          <span className="halo-required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input id={id} className="halo-input" aria-invalid={error ? true : undefined} aria-describedby={describedBy} required={required} {...rest} />
      {hint && (
        <p id={`${id}-hint`} className="halo-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="halo-error">
          {error}
        </p>
      )}
    </div>
  );
}
