import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DrawerFooter, DrawerPanel } from "../drawer";

describe("Drawer layout", () => {
  it("keeps the footer fixed while the panel uses a fading scroll area", () => {
    render(
      <div data-slot="drawer-popup">
        <DrawerPanel allowSelection={false}>Scrollable content</DrawerPanel>
        <DrawerFooter allowSelection={false}>Footer actions</DrawerFooter>
      </div>,
    );

    const panel = screen.getByText("Scrollable content");
    const scrollViewport = panel.closest("[data-slot=scroll-area-viewport]");
    const scrollRoot = scrollViewport?.parentElement;
    const footer = screen.getByText("Footer actions");

    expect(scrollRoot).toHaveClass("flex-1", "min-h-0");
    expect(scrollViewport).toHaveClass("mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))]");
    expect(panel).toHaveClass("pb-6");
    expect(footer).toHaveClass("sticky", "bottom-0", "shrink-0");
  });
});
