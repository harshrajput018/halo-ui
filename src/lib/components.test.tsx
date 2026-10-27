import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button, Checkbox, Combobox, Dialog, Menu, MenuContent, MenuItem, MenuTrigger, Switch, Tab, TabList, TabPanel, Tabs, TextField, ToastProvider, Tooltip, useToast } from "./index";

describe("Button", () => {
  it("ignores clicks while loading but stays focusable", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    btn.focus();
    expect(btn).toHaveFocus();
  });
});

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onOpenChange={setOpen} title="Rename file" description="Pick a new name." footer={<button onClick={() => setOpen(false)}>Save</button>}>
        <input aria-label="Name" />
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("is labelled, traps focus, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<DialogDemo />);
    const opener = screen.getByRole("button", { name: "Open" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Rename file" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Pick a new name.");
    expect(screen.getByLabelText("Name")).toHaveFocus();

    await user.tab(); // Save
    await user.tab(); // Close
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.tab(); // wraps back to the first element
    expect(screen.getByLabelText("Name")).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("locks page scroll while open", async () => {
    render(<DialogDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Tabs", () => {
  const ui = (activation?: "manual") => (
    <Tabs defaultValue="a" activation={activation}>
      <TabList aria-label="Settings">
        <Tab value="a">Account</Tab>
        <Tab value="b" disabled>Billing</Tab>
        <Tab value="c">Team</Tab>
      </TabList>
      <TabPanel value="a">Account panel</TabPanel>
      <TabPanel value="c">Team panel</TabPanel>
    </Tabs>
  );

  it("uses roving tabindex and links tabs to panels", () => {
    render(ui());
    const [a, , c] = screen.getAllByRole("tab");
    expect(a).toHaveAttribute("tabindex", "0");
    expect(c).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tabpanel", { name: "Account" })).toHaveTextContent("Account panel");
  });

  it("arrow keys skip disabled tabs, wrap, and activate automatically", async () => {
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole("tab", { name: "Account" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team panel");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute("aria-selected", "true");
  });

  it("manual activation moves focus without selecting", async () => {
    const user = userEvent.setup();
    render(ui("manual"));
    await user.click(screen.getByRole("tab", { name: "Account" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account panel");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team panel");
  });
});

describe("Menu", () => {
  const onSelect = vi.fn();
  const ui = () => (
    <Menu>
      <MenuTrigger>
        <button>Actions</button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={() => onSelect("edit")}>Edit</MenuItem>
        <MenuItem onSelect={() => onSelect("dup")}>Duplicate</MenuItem>
        <MenuItem disabled>Archive</MenuItem>
        <MenuItem onSelect={() => onSelect("del")}>Delete</MenuItem>
      </MenuContent>
    </Menu>
  );

  it("opens from the keyboard, focuses items, skips disabled ones", async () => {
    const user = userEvent.setup();
    render(ui());
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
  });

  it("ArrowUp on the trigger focuses the last item", async () => {
    const user = userEvent.setup();
    render(ui());
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });

  it("supports typeahead, selects with Enter and returns focus", async () => {
    const user = userEvent.setup();
    onSelect.mockClear();
    render(ui());
    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);
    await user.keyboard("du");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("dup");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("Combobox", () => {
  const options = [
    { value: "in", label: "India" },
    { value: "id", label: "Indonesia" },
    { value: "ie", label: "Ireland", disabled: true },
    { value: "jp", label: "Japan" },
  ];

  it("filters, tracks the active option via aria-activedescendant, and commits with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Country" options={options} onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.type(input, "ind");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["India", "Indonesia"]);
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "India" }).id);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("id");
    expect(input).toHaveValue("Indonesia");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("skips disabled options and says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={options} defaultValue="id" />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Japan" })).toHaveAttribute("data-active", "true");
    await user.clear(input);
    await user.type(input, "zzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("Escape closes, then clears", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Country" options={options} defaultValue="jp" onChange={onChange} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Escape}");
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("Tooltip", () => {
  it("shows on focus, describes its trigger and hides on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Copy link">
        <button aria-label="Share">↗</button>
      </Tooltip>,
    );
    await user.tab();
    const tip = await screen.findByRole("tooltip");
    expect(screen.getByRole("button", { name: "Share" })).toHaveAccessibleDescription("Copy link");
    await user.keyboard("{Escape}");
    expect(tip).not.toBeInTheDocument();
  });
});

function ToastDemo() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast({ title: "Saved", description: "All changes stored." })}>Save</button>
      <button onClick={() => toast({ title: "Upload failed", variant: "error" })}>Fail</button>
    </>
  );
}

describe("Toast", () => {
  it("announces politely, errors assertively, and auto-dismisses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    await user.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
    act(() => vi.advanceTimersByTime(5100));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument(); // errors wait to be dismissed
    vi.useRealTimers();
  });
});

describe("Switch, Checkbox, TextField", () => {
  it("switch exposes aria-checked and toggles from its label", async () => {
    const user = userEvent.setup();
    render(<Switch label="Email alerts" />);
    const sw = screen.getByRole("switch", { name: "Email alerts" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(screen.getByText("Email alerts"));
    expect(sw).toHaveAttribute("aria-checked", "true");
    await user.keyboard(" ");
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("checkbox supports the indeterminate state", () => {
    render(<Checkbox label="Select all" indeterminate />);
    expect((screen.getByRole("checkbox", { name: "Select all" }) as HTMLInputElement).indeterminate).toBe(true);
  });

  it("text field wires hint and error into its description", () => {
    render(<TextField label="Email" hint="We never share it." error="Enter a valid email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("We never share it. Enter a valid email");
  });
});

describe("accessibility scan", () => {
  it("has no axe violations across components", async () => {
    const { container } = render(
      <ToastProvider>
        <Button>Go</Button>
        <Tabs defaultValue="a">
          <TabList aria-label="Demo">
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
        <Combobox label="Fruit" options={[{ value: "a", label: "Apple" }]} />
        <Switch label="Wi-Fi" />
        <Checkbox label="Agree" />
        <TextField label="Name" hint="Your full name" />
      </ToastProvider>,
    );
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
});
