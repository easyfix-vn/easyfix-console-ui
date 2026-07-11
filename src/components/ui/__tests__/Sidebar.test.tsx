import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  MenuItem,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
} from "@/components/ui/menu";
import {
  SidebarMenuButton,
  SidebarMenuSubButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
});

describe("Sidebar", () => {
  it("renders clickable submenu buttons with pointer cursor", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <SidebarMenuSubButton onClick={onClick}>
        <span>Sub menu item</span>
      </SidebarMenuSubButton>,
    );

    const button = screen.getByText("Sub menu item").closest("a");

    expect(button).not.toBeNull();
    expect(button).toHaveClass("cursor-pointer");
    await user.click(button!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("highlights submenu icons when the submenu button is active", () => {
    render(
      <SidebarMenuSubButton isActive>
        <svg data-testid="submenu-icon" />
        <span>Active sub menu item</span>
      </SidebarMenuSubButton>,
    );

    const button = screen.getByText("Active sub menu item").closest("a");

    expect(screen.getByTestId("submenu-icon")).toBeInTheDocument();
    expect(button).toHaveAttribute("data-active", "true");
    expect(button).toHaveClass(
      "data-[active=true]:[&>svg]:text-sidebar-primary",
    );
  });

  it("opens a collapsed sidebar menu popup from a top-level menu button", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider defaultOpen={false}>
        <SidebarMenuButton
          collapsedMenu={
            <>
              <MenuItem isActive>快速开始</MenuItem>
              <MenuSub>
                <MenuSubTrigger isActive>组件</MenuSubTrigger>
                <MenuSubPopup>
                  <MenuItem>Button 按钮</MenuItem>
                </MenuSubPopup>
              </MenuSub>
            </>
          }
        >
          <svg aria-hidden="true" />
          <span>文档中心</span>
        </SidebarMenuButton>
      </SidebarProvider>,
    );

    await user.click(screen.getByRole("button", { name: "文档中心" }));

    expect(await screen.findByText("快速开始")).toBeInTheDocument();
    expect(screen.getByText("组件")).toBeInTheDocument();
    expect(screen.getByText("快速开始")).toHaveAttribute("data-active", "true");
    expect(screen.getByText("快速开始")).toHaveClass(
      "data-[active=true]:bg-sidebar-primary/10",
    );
    expect(screen.getByText("快速开始")).toHaveClass(
      "data-[active=true]:text-sidebar-primary",
    );
    expect(screen.getByText("组件")).toHaveAttribute("data-active", "true");
    expect(screen.getByText("组件")).toHaveClass(
      "data-[active=true]:bg-sidebar-primary/10",
    );
    expect(screen.getByText("组件")).toHaveClass(
      "data-[active=true]:text-sidebar-primary",
    );
  });
});
