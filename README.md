# Halo UI: accessible React components, from scratch

A small component library built on the **WAI-ARIA Authoring Practices**: no Radix, no Headless UI, no Floating UI. It includes a docs site and behaviour tests for every component.

| Component | Pattern highlights |
|---|---|
| Button | 5 variants, 3 sizes; loading keeps focus (`aria-busy`) |
| Dialog | Focus trap, focus restore, scroll lock without layout shift, `alertdialog` mode |
| Tabs | Roving tabindex, automatic or manual activation, vertical orientation |
| Menu | Menu-button pattern, typeahead, skips disabled items, flip positioning |
| Combobox | `aria-activedescendant`, list autocomplete, live result count, Esc-to-clear |
| Tooltip | Hover delay, instant on focus, Esc dismiss, ignores touch |
| Toast | Polite status / assertive alert, pause on hover and focus, F8 to jump |
| Switch, Checkbox, TextField | Label, hint and error wiring; indeterminate checkbox |

Hooks: `useControllableState`, `useFocusTrap`, `useDismiss`, `usePosition`, `useTypeahead`, `useScrollLock`.

**Theming.** Every visual decision is a CSS custom property. Hover and soft tints come from `color-mix()`, so changing `--halo-accent` re-themes everything, dark mode included.

## Tests
19 tests with Vitest, Testing Library and user-event, plus an **axe-core** scan. They check focus trapping and restore, roving focus, typeahead, `aria-activedescendant`, live regions and timers.

## Run
```bash
npm install
npm run dev         # docs site
npm test
npm run build:lib   # ESM bundle + halo.css + .d.ts → dist-lib/ (~7 kB gzipped)
```
