import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyMultiSelect } from "./EasyMultiSelect";

const options = [
  { value: "admin", label: "Admin", description: "Full access" },
  { value: "viewer", label: "Viewer" },
  { value: "disabled", label: "Disabled", disabled: true },
];

describe("EasyMultiSelect", () => {
  it("renders selected badges and folded count", () => {
    render(<EasyMultiSelect value={["admin", "viewer"]} onChange={vi.fn()} options={options} maxCount={1} />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("removes selected item from badge", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EasyMultiSelect value={["admin"]} onChange={onChange} options={options} />);

    await user.click(screen.getByLabelText("multiSelect.removeOption"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
