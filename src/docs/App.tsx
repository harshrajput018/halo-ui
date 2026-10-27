import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Checkbox, Combobox, Dialog, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, Switch, Tab, TabList, TabPanel, Tabs, TextField, ToastProvider, Tooltip, useToast } from "../lib";

const SECTIONS = [
  ["intro", "Introduction"],
  ["theming", "Theming"],
  ["button", "Button"],
  ["dialog", "Dialog"],
  ["tabs", "Tabs"],
  ["menu", "Menu"],
  ["combobox", "Combobox"],
  ["tooltip", "Tooltip"],
  ["toast", "Toast"],
  ["inputs", "Switch, Checkbox, TextField"],
] as const;

const ACCENTS = ["#6d5efc", "#2563eb", "#0d9488", "#16a34a", "#ea580c", "#e11d48", "#18181b"];

const COUNTRIES = [
  ["in", "India", "Asia"], ["id", "Indonesia", "Asia"], ["jp", "Japan", "Asia"], ["sg", "Singapore", "Asia"], ["ae", "United Arab Emirates", "Asia"],
  ["de", "Germany", "Europe"], ["fr", "France", "Europe"], ["ie", "Ireland", "Europe"], ["nl", "Netherlands", "Europe"], ["gb", "United Kingdom", "Europe"],
  ["us", "United States", "Americas"], ["ca", "Canada", "Americas"], ["br", "Brazil", "Americas"], ["au", "Australia", "Oceania"], ["ke", "Kenya", "Africa"],
].map(([value, label, hint]) => ({ value, label, hint, disabled: value === "ie" }));

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-b-xl border-x border-b border-[var(--halo-border)] bg-[var(--docs-code)] px-4 py-3.5 font-mono text-[12.5px] leading-6 text-[var(--halo-fg)]">
        <code>{children.trim()}</code>
      </pre>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(children.trim()).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1200)))}
        className="absolute right-2 top-2 rounded-md border border-[var(--halo-border)] bg-[var(--halo-surface)] px-2 py-1 text-[11px] text-[var(--halo-muted)] opacity-0 transition group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Keys({ rows }: { rows: [string, string][] }) {
  return (
    <table className="mt-4 w-full text-left text-sm">
      <caption className="sr-only">Keyboard interactions</caption>
      <thead>
        <tr className="border-b border-[var(--halo-border)] text-xs uppercase tracking-wide text-[var(--halo-muted)]">
          <th scope="col" className="py-2 pr-4 font-medium">Key</th>
          <th scope="col" className="py-2 font-medium">Does</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-[var(--halo-border)] last:border-0">
            <td className="whitespace-nowrap py-2 pr-4">
              {k.split(" / ").map((x, i) => (
                <span key={x}>
                  {i > 0 && <span className="text-[var(--halo-muted)]"> / </span>}
                  <kbd className="rounded border border-[var(--halo-border-strong)] bg-[var(--halo-surface-2)] px-1.5 py-0.5 font-mono text-[11px]">{x}</kbd>
                </span>
              ))}
            </td>
            <td className="py-2 text-[var(--halo-muted)]">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ id, title, intro, children, code, keys, a11y }: { id: string; title: string; intro: string; children: ReactNode; code: string; keys?: [string, string][]; a11y?: string[] }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[var(--halo-border)] py-14 first:border-0">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-[var(--halo-muted)]">{intro}</p>
      <div className="mt-6">
        <div className="docs-preview flex min-h-40 flex-wrap items-center justify-center gap-3 rounded-t-xl border border-[var(--halo-border)] p-8">{children}</div>
        <Code>{code}</Code>
      </div>
      {(keys || a11y) && (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {keys && (
            <div>
              <h3 className="text-sm font-semibold">Keyboard</h3>
              <Keys rows={keys} />
            </div>
          )}
          {a11y && (
            <div>
              <h3 className="text-sm font-semibold">Accessibility</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--halo-muted)]">
                {a11y.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--halo-accent)]" aria-hidden="true" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <Button variant="outline" onClick={() => setConfirm(true)}>
        Delete project
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit profile"
        description="Changes are visible to everyone in your workspace."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => (setOpen(false), toast({ title: "Profile updated", variant: "success" }))}>Save changes</Button>
          </>
        }
      >
        <TextField label="Display name" defaultValue="Harsh Rajput" />
        <TextField label="Username" defaultValue="harsh" hint="Lowercase letters and numbers only." />
      </Dialog>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        role="alertdialog"
        size="sm"
        title="Delete “Website redesign”?"
        description="This removes 48 tasks and can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Keep project</Button>
            <Button variant="danger" onClick={() => (setConfirm(false), toast({ title: "Project deleted", action: { label: "Undo", onClick: () => toast({ title: "Restored" }) } }))}>
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <>
      <Button variant="outline" onClick={() => toast({ title: "Changes saved", description: "Your draft is stored on the server." })}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast({ title: "Invite sent", description: "priya@acme.dev will get an email.", variant: "success" })}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast({ title: "Upload failed", description: "The file is larger than 25 MB.", variant: "error", action: { label: "Retry", onClick: () => {} } })}>
        Error
      </Button>
    </>
  );
}

function LoadingButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button loading={loading} onClick={() => (setLoading(true), setTimeout(() => setLoading(false), 1600))}>
      {loading ? "Saving…" : "Save"}
    </Button>
  );
}

function CheckboxGroup() {
  const items = ["Comments", "Mentions", "Weekly digest"];
  const [on, setOn] = useState<string[]>(["Mentions"]);
  const all = on.length === items.length;
  return (
    <div className="grid w-64 gap-3">
      <Checkbox label="All notifications" checked={all} indeterminate={!all && on.length > 0} onChange={() => setOn(all ? [] : items)} />
      <div className="grid gap-3 border-l border-[var(--halo-border)] pl-5">
        {items.map((i) => (
          <Checkbox key={i} label={i} checked={on.includes(i)} onChange={() => setOn((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"system" | "light" | "dark">(() => (localStorage.getItem("halo-theme") as "light" | "dark") ?? "system");
  const [accent, setAccent] = useState(() => localStorage.getItem("halo-accent") ?? ACCENTS[0]);
  const [radius, setRadius] = useState(10);
  const [active, setActive] = useState("intro");
  const [country, setCountry] = useState<string | null>("in");
  const [email, setEmail] = useState("harsh@");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      localStorage.setItem("halo-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent === ACCENTS[0]) root.style.removeProperty("--halo-accent");
    else root.style.setProperty("--halo-accent", accent);
    root.style.setProperty("--halo-radius", `${radius}px`);
    root.style.setProperty("--halo-radius-sm", `${Math.max(2, radius - 3)}px`);
    try {
      localStorage.setItem("halo-accent", accent);
    } catch {
      /* ignore */
    }
  }, [accent, radius]);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-20% 0px -70% 0px" });
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter an email like name@company.com" : undefined;

  return (
    <ToastProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--halo-accent)] focus:px-3 focus:py-2 focus:text-[var(--halo-accent-fg)]">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--halo-border)] bg-[color-mix(in_oklab,var(--halo-bg)_85%,transparent)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--halo-accent)]" aria-hidden="true">
            <span className="h-3 w-3 rounded-full border-2 border-[var(--halo-accent-fg)]" />
          </span>
          <span className="font-semibold tracking-tight">Halo UI</span>
          <span className="rounded-full bg-[var(--halo-surface-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--halo-muted)]">v0.1</span>
          <div className="ml-auto flex items-center gap-1">
            {(["light", "system", "dark"] as const).map((t) => (
              <Tooltip key={t} content={`${t[0].toUpperCase()}${t.slice(1)} theme`} placement="bottom">
                <button
                  type="button"
                  aria-label={`${t} theme`}
                  aria-pressed={theme === t}
                  onClick={() => setTheme(t)}
                  className={`grid h-8 w-8 place-items-center rounded-md text-sm transition ${theme === t ? "bg-[var(--halo-surface-2)] text-[var(--halo-fg)]" : "text-[var(--halo-muted)] hover:text-[var(--halo-fg)]"}`}
                >
                  {t === "light" ? "☀" : t === "dark" ? "☾" : "◐"}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 sm:px-6">
        <nav ref={navRef} aria-label="Components" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 lg:block">
          <ul className="space-y-0.5 text-sm">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? "true" : undefined}
                  className={`block rounded-md px-3 py-1.5 transition ${active === id ? "bg-[var(--halo-accent-soft)] font-medium text-[var(--halo-fg)]" : "text-[var(--halo-muted)] hover:text-[var(--halo-fg)]"}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="min-w-0 flex-1 pb-24">
          <section id="intro" className="scroll-mt-20 pb-14 pt-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--halo-accent)]">React component library</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Accessible components, built on the WAI-ARIA patterns.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--halo-muted)]">
              Every component here is written from scratch, with no Radix, no Headless UI and no Floating UI. Each one follows the ARIA Authoring Practices for keyboard handling, focus management and screen readers, and has tests that prove it.
            </p>
            <dl className="mt-8 grid max-w-xl grid-cols-3 gap-6 border-t border-[var(--halo-border)] pt-6">
              {[
                ["9", "components"],
                ["6", "reusable hooks"],
                ["19", "behaviour + axe tests"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-2xl font-semibold">{v}</dd>
                  <dd className="text-xs text-[var(--halo-muted)]">{l}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 [&_pre]:rounded-xl [&_pre]:border-t">
              <Code>{`# Not on npm yet: build the package locally
npm run build:lib   # → dist-lib/halo.js, halo.css, types

import { Button, Dialog, useToast } from "halo-ui";
import "halo-ui/halo.css";`}</Code>
            </div>
          </section>

          <Section
            id="theming"
            title="Theming"
            intro="Every visual decision is a CSS custom property. Change the accent or corner radius below and the whole page follows, dark mode included. Hover and soft tints are derived with color-mix(), so one variable is enough."
            code={`:root {
  --halo-accent: ${accent};
  --halo-radius: ${radius}px;
}`}
          >
            <div className="grid w-full max-w-md gap-6">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Accent</legend>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Accent ${c}`}
                      aria-pressed={accent === c}
                      onClick={() => setAccent(c)}
                      className="h-8 w-8 rounded-full outline-offset-2 transition aria-pressed:outline-2 aria-pressed:outline-[var(--halo-fg)]"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-2 text-sm font-medium">
                Radius: {radius}px
                <input type="range" min={0} max={20} value={radius} onChange={(e) => setRadius(+e.target.value)} className="accent-[var(--halo-accent)]" />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button>Solid</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="outline">Outline</Button>
                <Switch label="Preview" defaultChecked />
              </div>
            </div>
          </Section>

          <Section
            id="button"
            title="Button"
            intro="Five variants and three sizes. While loading, the button stays focusable but is marked aria-busy, so keyboard users don't lose their place mid-action."
            code={`<Button>Solid</Button>
<Button variant="soft">Soft</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>
<Button loading>Saving…</Button>`}
            a11y={["Native <button>, so it is focusable, activates with Enter and Space, and works in forms", "Loading state uses aria-busy + aria-disabled instead of disabled, so focus is kept", "Visible focus ring that respects the theme"]}
          >
            <Button>Solid</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Delete</Button>
            <LoadingButton />
            <Button size="sm" variant="outline">Small</Button>
            <Button size="lg">Large</Button>
          </Section>

          <Section
            id="dialog"
            title="Dialog"
            intro="A modal dialog with a focus trap, scroll lock and focus restore. Use role='alertdialog' for destructive confirmations: clicking outside won't dismiss those."
            code={`const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Edit profile"
  description="Changes are visible to everyone."
  footer={<Button onClick={save}>Save changes</Button>}
>
  <TextField label="Display name" />
</Dialog>`}
            keys={[
              ["Tab / Shift+Tab", "Cycle focus inside the dialog only"],
              ["Esc", "Close and return focus to the trigger"],
            ]}
            a11y={["aria-modal plus aria-labelledby/aria-describedby are wired to the title and description", "Focus moves into the dialog on open and returns to the opener on close", "Page scroll is locked, with scrollbar-width compensation to avoid layout shift"]}
          >
            <DialogDemo />
          </Section>

          <Section
            id="tabs"
            title="Tabs"
            intro="Roving tabindex, so only the selected tab is in the tab order. Activation is automatic by default; switch to manual when a panel is expensive to render."
            code={`<Tabs defaultValue="overview">
  <TabList aria-label="Project">
    <Tab value="overview">Overview</Tab>
    <Tab value="activity">Activity</Tab>
    <Tab value="settings" disabled>Settings</Tab>
  </TabList>
  <TabPanel value="overview">…</TabPanel>
  <TabPanel value="activity">…</TabPanel>
</Tabs>`}
            keys={[
              ["← / →", "Previous / next tab (wraps, skips disabled)"],
              ["Home / End", "First / last tab"],
              ["Enter / Space", "Select (manual activation)"],
            ]}
          >
            <div className="w-full max-w-lg">
              <Tabs defaultValue="overview">
                <TabList aria-label="Project">
                  <Tab value="overview">Overview</Tab>
                  <Tab value="activity">Activity</Tab>
                  <Tab value="members">Members</Tab>
                  <Tab value="settings" disabled>Settings</Tab>
                </TabList>
                <TabPanel value="overview">
                  <p className="text-[var(--halo-muted)]">The redesign is 64% complete with 12 open tasks. Next milestone: usability testing on 3 Nov.</p>
                </TabPanel>
                <TabPanel value="activity">
                  <p className="text-[var(--halo-muted)]">Priya moved “Checkout flow” to Review · 2h ago</p>
                </TabPanel>
                <TabPanel value="members">
                  <p className="text-[var(--halo-muted)]">5 members · 2 admins</p>
                </TabPanel>
              </Tabs>
            </div>
          </Section>

          <Section
            id="menu"
            title="Menu"
            intro="The menu-button pattern: real focus moves between items, typeahead jumps to a match, and choosing an item returns focus to the trigger. Positioning flips above the trigger when there's no room below."
            code={`<Menu>
  <MenuTrigger>
    <Button variant="outline">Options</Button>
  </MenuTrigger>
  <MenuContent>
    <MenuItem shortcut="⌘E" onSelect={edit}>Edit</MenuItem>
    <MenuItem onSelect={duplicate}>Duplicate</MenuItem>
    <MenuSeparator />
    <MenuItem danger onSelect={remove}>Delete</MenuItem>
  </MenuContent>
</Menu>`}
            keys={[
              ["↓ / ↑ on trigger", "Open and focus the first / last item"],
              ["↓ / ↑", "Move between items (wraps, skips disabled)"],
              ["a–z", "Typeahead: jump to the next matching item"],
              ["Enter / Space", "Choose and close"],
              ["Esc / Tab", "Close"],
            ]}
          >
            <Menu>
              <MenuTrigger>
                <Button variant="outline">Options ▾</Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Document</MenuLabel>
                <MenuItem shortcut="⌘E">Edit</MenuItem>
                <MenuItem shortcut="⌘D">Duplicate</MenuItem>
                <MenuItem>Move to…</MenuItem>
                <MenuItem disabled>Archive</MenuItem>
                <MenuSeparator />
                <MenuItem danger shortcut="⌫">Delete</MenuItem>
              </MenuContent>
            </Menu>
          </Section>

          <Section
            id="combobox"
            title="Combobox"
            intro="An editable combobox with list autocomplete. DOM focus stays in the input and aria-activedescendant points at the highlighted option, so screen readers announce it while you keep typing."
            code={`<Combobox
  label="Country"
  options={countries}
  value={country}
  onChange={setCountry}
  placeholder="Search countries…"
/>`}
            keys={[
              ["↓ / ↑", "Open, then move the highlight"],
              ["Enter", "Choose the highlighted option"],
              ["Esc", "Close; press again to clear"],
            ]}
            a11y={["role=combobox with aria-expanded, aria-controls and aria-autocomplete", "The result count is announced through a polite live region", "Disabled options are announced but skipped by the arrow keys"]}
          >
            <div className="w-72">
              <Combobox label="Country" options={COUNTRIES} value={country} onChange={setCountry} placeholder="Search countries…" hint="Ireland is disabled to show skipping." />
            </div>
          </Section>

          <Section
            id="tooltip"
            title="Tooltip"
            intro="Supplementary text for an element that already has an accessible name. It opens after a short hover delay, or immediately on keyboard focus."
            code={`<Tooltip content="Copy link">
  <button aria-label="Share">…</button>
</Tooltip>`}
            keys={[["Esc", "Dismiss without moving focus"]]}
            a11y={["Linked to the trigger with aria-describedby only while visible", "Never the only label: icon buttons still need aria-label", "Ignores touch hover, so it doesn't stick open on mobile"]}
          >
            {[
              ["Bold", "B", "⌘B"],
              ["Italic", "I", "⌘I"],
              ["Copy link", "⧉", "⌘L"],
            ].map(([label, icon, kbd]) => (
              <Tooltip key={label} content={`${label}  ${kbd}`}>
                <button type="button" aria-label={label} className="grid h-10 w-10 place-items-center rounded-[var(--halo-radius-sm)] border border-[var(--halo-border-strong)] bg-[var(--halo-surface)] font-semibold">
                  {icon}
                </button>
              </Tooltip>
            ))}
          </Section>

          <Section
            id="toast"
            title="Toast"
            intro="Notifications in a labelled region. Success and info toasts are polite status messages that pause while hovered or focused. Errors are assertive alerts that wait for you to dismiss them."
            code={`const toast = useToast();

toast({ title: "Invite sent", variant: "success" });
toast({
  title: "Upload failed",
  variant: "error",
  action: { label: "Retry", onClick: retry },
});`}
            keys={[
              ["F8", "Jump to the latest notification"],
              ["Esc", "Dismiss the focused notification"],
            ]}
          >
            <ToastDemo />
          </Section>

          <Section
            id="inputs"
            title="Switch, Checkbox, TextField"
            intro="Form controls with their labels, hints and errors wired together through ids. The checkbox is a native input underneath, so forms and autofill just work, and it supports the indeterminate state."
            code={`<Switch label="Email alerts" description="Daily summary at 9am" />
<Checkbox label="All notifications" indeterminate />
<TextField label="Work email" error="Enter a valid email" required />`}
          >
            <div className="grid w-full max-w-2xl gap-8 sm:grid-cols-2">
              <div className="grid gap-5">
                <Switch label="Email alerts" description="A summary every morning at 9am." defaultChecked />
                <Switch label="Desktop notifications" />
                <TextField label="Work email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} required />
              </div>
              <CheckboxGroup />
            </div>
          </Section>
        </main>
      </div>

      <footer className="border-t border-[var(--halo-border)] py-8 text-center text-sm text-[var(--halo-muted)]">Halo UI · built by Harsh Rajput · React 19 + TypeScript</footer>
    </ToastProvider>
  );
}
