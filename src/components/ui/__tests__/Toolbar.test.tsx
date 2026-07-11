import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Toggle } from "../toggle";
import { Toolbar, ToolbarButton, ToolbarGroup } from "../toolbar";

describe("Toolbar", () => {
  it("forwards the composite item ref through a rendered Toggle", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Toolbar>
        <ToolbarGroup>
          <ToolbarButton label="Bold" render={<Toggle ref={ref} />}>
            B
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>,
    );

    expect(screen.getByRole("button", { name: "Bold" })).toBe(ref.current);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});
