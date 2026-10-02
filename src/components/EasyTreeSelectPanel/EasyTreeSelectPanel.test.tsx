import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyTreeSelectPanel } from "./EasyTreeSelectPanel";

describe("EasyTreeSelectPanel", () => {
  it("selects and expands nodes with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <EasyTreeSelectPanel
        treeData={[
          {
            id: "team",
            label: "Team",
            children: [{ id: "member", label: "Member" }],
          },
          { id: "disabled", label: "Disabled", disabled: true },
        ]}
        onSelect={onSelect}
      />,
    );

    const team = screen.getByRole("button", { name: "Team" });
    team.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "team" }));

    const toggle = screen.getByRole("button", { expanded: true });
    expect(screen.getByRole("button", { name: "Member" })).toBeInTheDocument();
    toggle.focus();
    await user.keyboard(" ");
    expect(screen.queryByRole("button", { name: "Member" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });
});
