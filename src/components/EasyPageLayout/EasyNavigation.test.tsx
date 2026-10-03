import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "../../i18n";
import { EasyNavigationMenu, type EasyNavigationMenuItem } from "./EasyNavigationMenu";
import { EasyNavigationRail } from "./EasyNavigationRail";
import { EasyWorkspaceTabs, type EasyWorkspaceTabItem } from "./EasyWorkspaceTabs";

const menuItems: EasyNavigationMenuItem[] = [
  { key: "service", label: "Services", children: [
    { key: "repairs", label: "Repairs", children: [
      { key: "orders", label: "Orders" },
      { key: "returns", label: "Returns" },
    ] },
    { key: "inventory", label: "Inventory" },
  ] },
  { key: "reports", label: "Reports" },
];

describe("EasyNavigationMenu", () => {
  it("opens active ancestors across three levels and allows manual collapse", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EasyNavigationMenu items={menuItems} activeKey="orders" onSelect={onSelect} searchable={false} />);
    expect(screen.getByRole("button", { name: "Services" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Repairs" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Orders" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Returns" }));
    expect(onSelect).toHaveBeenCalledWith("returns");
    await user.click(screen.getByRole("button", { name: "Services" }));
    expect(screen.getByRole("button", { name: "Services" })).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Orders" })).not.toBeInTheDocument());
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("filters a leaf while preserving its ancestor path and restores collapsed state", async () => {
    const user = userEvent.setup();
    render(<EasyNavigationMenu items={menuItems} onSelect={vi.fn()} filterPlaceholder="Filter navigation" />);
    expect(screen.queryByRole("button", { name: "Orders" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Filter navigation" }), "orders");
    expect(screen.getByRole("button", { name: "Services" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Repairs" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Orders" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reports" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Returns" })).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Filter navigation" }));
    expect(screen.getByRole("button", { name: "Services" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Reports" })).toBeInTheDocument();
  });

  it("blocks disabled leaves and exposes an empty result message", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EasyNavigationMenu items={[{ key: "reports", label: "Reports", disabled: true }]} onSelect={onSelect} filterPlaceholder="Filter navigation" emptyContent="No matching pages" />);
    await user.click(screen.getByRole("button", { name: "Reports" }));
    expect(onSelect).not.toHaveBeenCalled();
    await user.type(screen.getByRole("textbox", { name: "Filter navigation" }), "missing");
    expect(screen.getByRole("status")).toHaveTextContent("No matching pages");
  });
});

const tabs: EasyWorkspaceTabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "disabled", label: "Unavailable", disabled: true },
  { key: "orders", label: "Orders", closable: true },
];

describe("EasyWorkspaceTabs", () => {
  it("closes a tab without selecting it or referring to a missing panel", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<EasyI18nProvider locale="en-US"><EasyWorkspaceTabs items={tabs} activeKey="overview" onSelect={onSelect} onClose={onClose} /></EasyI18nProvider>);
    await user.click(screen.getByRole("button", { name: "Close Orders" }));
    expect(onClose).toHaveBeenCalledWith("orders");
    expect(onSelect).not.toHaveBeenCalled();
    screen.getAllByRole("tab").forEach((tab) => expect(tab).not.toHaveAttribute("aria-controls"));
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports controlled keyboard navigation without activating disabled tabs", async () => {
    const user = userEvent.setup();
    function ControlledTabs() {
      const [activeKey, setActiveKey] = useState("overview");
      return <EasyWorkspaceTabs items={tabs} activeKey={activeKey} onSelect={setActiveKey} />;
    }
    render(<ControlledTabs />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(screen.getByRole("tab", { name: "Unavailable" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}{Enter}");
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}{Enter}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("EasyNavigationRail", () => {
  it("names icon navigation and reports selection without owning routing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EasyNavigationRail label="Applications" activeKey="home" onSelect={onSelect} items={[{ key: "home", label: "Home", icon: <span>H</span> }, { key: "orders", label: "Orders", icon: <span>O</span> }]} />);
    expect(screen.getByRole("navigation", { name: "Applications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Orders" }));
    expect(onSelect).toHaveBeenCalledWith("orders");
  });
});
