import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlList,
} from "../segmented-control";

describe("SegmentedControl", () => {
  it("通过 Root size 控制 List 和 Item 尺寸", () => {
    render(
      <SegmentedControl defaultValue="list" size="lg">
        <SegmentedControlList data-testid="segmented-list">
          <SegmentedControlItem value="list">列表</SegmentedControlItem>
          <SegmentedControlItem value="grid">网格</SegmentedControlItem>
        </SegmentedControlList>
      </SegmentedControl>,
    );

    expect(screen.getByTestId("segmented-list").className).toContain(
      "rounded-xl",
    );
    expect(screen.getByRole("tab", { name: "列表" }).className).toContain(
      "h-9",
    );
  });

  it("Item size 可以覆盖继承尺寸", () => {
    render(
      <SegmentedControl defaultValue="list" size="lg">
        <SegmentedControlList>
          <SegmentedControlItem size="xs" value="list">
            列表
          </SegmentedControlItem>
          <SegmentedControlItem value="grid">网格</SegmentedControlItem>
        </SegmentedControlList>
      </SegmentedControl>,
    );

    expect(screen.getByRole("tab", { name: "列表" }).className).toContain(
      "h-6",
    );
    expect(screen.getByRole("tab", { name: "网格" }).className).toContain(
      "h-9",
    );
  });
});
