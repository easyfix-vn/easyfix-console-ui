import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EasyButtonGroup } from "@/components/EasyButtonGroup";
import { EasyButton } from "./EasyButton";

describe("EasyButtonGroup", () => {
  it("渲染多个按钮子元素", () => {
    render(
      <EasyButtonGroup>
        <EasyButton>按钮一</EasyButton>
        <EasyButton>按钮二</EasyButton>
        <EasyButton>按钮三</EasyButton>
      </EasyButtonGroup>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("具有 group role", () => {
    render(
      <EasyButtonGroup>
        <EasyButton>A</EasyButton>
      </EasyButtonGroup>,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("具有 data-slot 属性", () => {
    render(
      <EasyButtonGroup>
        <EasyButton>A</EasyButton>
      </EasyButtonGroup>,
    );
    expect(screen.getByRole("group")).toHaveAttribute(
      "data-slot",
      "easy-button-group",
    );
  });

  it("默认水平排列", () => {
    render(
      <EasyButtonGroup>
        <EasyButton>A</EasyButton>
      </EasyButtonGroup>,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group.className).toContain("flex-row");
  });

  it("vertical 属性使按钮垂直排列", () => {
    render(
      <EasyButtonGroup orientation="vertical">
        <EasyButton>A</EasyButton>
      </EasyButtonGroup>,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group.className).toContain("flex-col");
  });

  it("非 attached 模式下有间距类名", () => {
    render(
      <EasyButtonGroup>
        <EasyButton>A</EasyButton>
        <EasyButton>B</EasyButton>
      </EasyButtonGroup>,
    );
    expect(screen.getByRole("group").className).toContain("gap-2");
  });

  it("attached 属性移除间距并添加合并样式", () => {
    render(
      <EasyButtonGroup attached>
        <EasyButton>A</EasyButton>
        <EasyButton>B</EasyButton>
      </EasyButtonGroup>,
    );
    const group = screen.getByRole("group");
    expect(group.className).not.toContain("gap-2");
    expect(group.className).toContain("-ml-px");
  });

  it("支持自定义 className", () => {
    render(
      <EasyButtonGroup className="custom-class">
        <EasyButton>A</EasyButton>
      </EasyButtonGroup>,
    );
    expect(screen.getByRole("group").className).toContain("custom-class");
  });
});
