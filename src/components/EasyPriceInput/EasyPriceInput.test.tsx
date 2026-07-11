import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyPriceInput } from "./EasyPriceInput";

describe("EasyPriceInput", () => {
  it("renders formatted text before editing", () => {
    render(<EasyPriceInput value="1280000" onValueChange={vi.fn()} />);
    expect(screen.getByText("1,280,000 VND")).toBeInTheDocument();
  });

  it("applies size classes to the read-only display", () => {
    const { container } = render(
      <EasyPriceInput value="1280000" onValueChange={vi.fn()} size="lg" />,
    );

    const display = container.querySelector('[data-slot="price-input-display"]');

    expect(display).toHaveAttribute("data-size", "lg");
    expect(display).toHaveClass("min-h-9.5");
  });

  it("supports tag display variant without stretching the edit button", () => {
    const { container } = render(
      <EasyPriceInput
        value="1280000"
        onValueChange={vi.fn()}
        displayVariant="tag"
      />,
    );

    const display = container.querySelector('[data-slot="price-input-display"]');

    expect(display).toHaveAttribute("data-variant", "tag");
    expect(display).toHaveClass("w-fit");
    expect(display).toHaveClass("rounded-full");
  });

  it("enters edit mode when clicking the formatted amount", async () => {
    const user = userEvent.setup();

    render(<EasyPriceInput value="1280000" onValueChange={vi.fn()} />);

    const amount = screen.getByText("1,280,000 VND");
    expect(amount).toHaveAttribute("role", "button");
    expect(amount).toHaveClass("cursor-pointer");

    await user.click(amount);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("enters edit mode when clicking the display container", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EasyPriceInput value="1280000" onValueChange={vi.fn()} />,
    );
    const display = container.querySelector(
      '[data-slot="price-input-display"]',
    );

    expect(display).toHaveClass("cursor-pointer");

    await user.click(display as HTMLElement);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("only commits value after confirmation", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<EasyPriceInput value="1280000" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "编辑金额" }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "2000000");

    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认金额" }));
    expect(onValueChange).toHaveBeenCalledWith("2000000");
  });

  it("keeps currency precision when committing decimal amounts", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <EasyPriceInput
        value="1280.5"
        onValueChange={onValueChange}
        currency="USD"
      />,
    );

    await user.click(screen.getByRole("button", { name: "编辑金额" }));
    await user.click(screen.getByRole("button", { name: "确认金额" }));

    expect(onValueChange).toHaveBeenCalledWith("1280.50");
  });

  it("validates min and max on confirmation", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <EasyPriceInput
        value="500"
        onValueChange={onValueChange}
        min={100}
        max={1000}
      />,
    );

    await user.click(screen.getByRole("button", { name: "编辑金额" }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "50");
    await user.click(screen.getByRole("button", { name: "确认金额" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText("金额不能小于 100")).toBeInTheDocument();
  });
});
