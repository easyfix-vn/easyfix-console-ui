import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("keeps over-limit input and marks it invalid", async () => {
    const user = userEvent.setup();
    render(<Textarea maxLength={3} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "abcde");

    expect(textarea).toHaveValue("abcde");
    expect(textarea).toBeInvalid();
  });

  it("prevents native form submission when maxLength is exceeded", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Textarea maxLength={3} />
        <button type="submit">Submit</button>
      </form>,
    );

    await user.type(screen.getByRole("textbox"), "abcde");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
