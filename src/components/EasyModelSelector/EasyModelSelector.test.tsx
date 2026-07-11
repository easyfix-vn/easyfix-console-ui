import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyModelSelector } from "./EasyModelSelector";

describe("EasyModelSelector", () => {
  it("renders the default model tier", () => {
    render(<EasyModelSelector />);

    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("GPT-5.4")).toBeInTheDocument();
  });

  it("commits selected option from popup", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<EasyModelSelector onValueChange={onValueChange} />);

    await user.click(screen.getByText("Medium"));
    await user.click(screen.getByRole("option", { name: /Ultra/ }));

    expect(onValueChange).toHaveBeenCalledWith(
      "ultra",
      expect.objectContaining({ value: "ultra" }),
      4,
    );
  });

  it("supports keyboard adjustment on the slider", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <EasyModelSelector value="medium" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByText("Medium"));
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith(
      "high",
      expect.objectContaining({ value: "high" }),
      2,
    );
  });
});
