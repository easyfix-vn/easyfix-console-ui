import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyButton } from "./EasyButton";

describe("EasyButton", () => {
  it("renders children", () => {
    render(<EasyButton>提交</EasyButton>);
    expect(screen.getByRole("button", { name: "提交" })).toBeInTheDocument();
  });

  it("has type=button by default", () => {
    render(<EasyButton>Test</EasyButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EasyButton onClick={onClick}>Click</EasyButton>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EasyButton disabled onClick={onClick}>Click</EasyButton>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    render(<EasyButton loading>Save</EasyButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-loading", "");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("does not fire onClick when loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EasyButton loading onClick={onClick}>Save</EasyButton>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant class", () => {
    render(<EasyButton variant="destructive">Delete</EasyButton>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("destructive");
  });

  it("applies size class", () => {
    render(<EasyButton size="lg">Large</EasyButton>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("h-10");
  });

  it("has data-slot attribute", () => {
    render(<EasyButton>Slot</EasyButton>);
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "easy-button");
  });
});
