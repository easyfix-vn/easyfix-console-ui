import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyInput } from "./EasyInput";
import { EasyPasswordInput } from "@/components/EasyPasswordInput";

describe("EasyInput", () => {
  it("renders an input", () => {
    render(<EasyInput placeholder="Enter name" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("handles controlled value", async () => {
    const onChange = vi.fn();
    render(<EasyInput value="hello" onChange={onChange} />);
    const input = screen.getByDisplayValue("hello");
    expect(input).toBeInTheDocument();
  });

  it("handles uncontrolled input", async () => {
    const user = userEvent.setup();
    render(<EasyInput defaultValue="" placeholder="type here" />);
    const input = screen.getByPlaceholderText("type here");
    await user.type(input, "abc");
    expect(input).toHaveValue("abc");
  });

  it("renders prefix and suffix", () => {
    render(
      <EasyInput
        prefix={<span data-testid="prefix">$</span>}
        suffix={<span data-testid="suffix">.00</span>}
      />,
    );
    expect(screen.getByTestId("prefix")).toBeInTheDocument();
    expect(screen.getByTestId("suffix")).toBeInTheDocument();
  });

  it("shows clear button when allowClear and has value", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <EasyInput defaultValue="text" allowClear onClear={onClear} />,
    );
    const clearBtn = screen.getByLabelText("Clear");
    expect(clearBtn).toBeInTheDocument();
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("hides clear button when disabled", () => {
    render(<EasyInput defaultValue="text" allowClear disabled />);
    expect(screen.queryByLabelText("Clear")).not.toBeInTheDocument();
  });

  it("shows character count", () => {
    render(<EasyInput defaultValue="abc" showCount maxLength={10} />);
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
  });

  it("respects maxLength", async () => {
    const user = userEvent.setup();
    render(<EasyInput defaultValue="" maxLength={3} showCount />);
    const input = screen.getByRole("textbox");
    await user.type(input, "abcde");
    expect(input).toHaveValue("abc");
  });
});

describe("EasyPasswordInput", () => {
  it("renders as password by default", () => {
    render(<EasyPasswordInput placeholder="Password" />);
    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");
  });

  it("toggles visibility on click", async () => {
    const user = userEvent.setup();
    render(<EasyPasswordInput placeholder="Password" />);
    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByLabelText("Show password"));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByLabelText("Hide password"));
    expect(input).toHaveAttribute("type", "password");
  });

  it("starts visible with defaultVisible", () => {
    render(<EasyPasswordInput placeholder="Password" defaultVisible />);
    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "text");
  });

  it("disables toggle when input is disabled", () => {
    render(<EasyPasswordInput placeholder="Password" disabled />);
    const toggleBtn = screen.getByLabelText("Show password");
    expect(toggleBtn).toBeDisabled();
  });
});
