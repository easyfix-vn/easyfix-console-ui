import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EasyTabContainer, type EasyTabItem } from "./EasyTabContainer";

const items: EasyTabItem[] = [
  { value: "tab1", label: "标签一", content: "内容一" },
  { value: "tab2", label: "标签二", content: "内容二" },
  { value: "tab3", label: "标签三", content: "内容三", disabled: true },
];

describe("EasyTabContainer", () => {
  it("渲染所有标签页触发器", () => {
    render(<EasyTabContainer items={items} defaultValue="tab1" />);
    expect(screen.getByText("标签一")).toBeInTheDocument();
    expect(screen.getByText("标签二")).toBeInTheDocument();
    expect(screen.getByText("标签三")).toBeInTheDocument();
  });

  it("默认显示第一个标签页的内容", () => {
    render(<EasyTabContainer items={items} defaultValue="tab1" />);
    expect(screen.getByText("内容一")).toBeInTheDocument();
  });

  it("点击标签页切换显示对应内容", async () => {
    const user = userEvent.setup();
    render(<EasyTabContainer items={items} defaultValue="tab1" />);
    await user.click(screen.getByText("标签二"));
    expect(screen.getByText("内容二")).toBeInTheDocument();
  });

  it("disabled 标签页标记为不可用", () => {
    render(<EasyTabContainer items={items} defaultValue="tab1" />);
    const disabledTab = screen.getByText("标签三").closest("button")!;
    expect(disabledTab).toHaveAttribute("aria-disabled", "true");
    expect(disabledTab).toHaveAttribute("data-disabled", "");
  });

  it("点击 disabled 标签页不会切换内容", async () => {
    const user = userEvent.setup();
    render(<EasyTabContainer items={items} defaultValue="tab1" />);
    await user.click(screen.getByText("标签三"));
    expect(screen.getByText("内容一")).toBeInTheDocument();
  });

  it("容器具有 data-slot 属性", () => {
    const { container } = render(
      <EasyTabContainer items={items} defaultValue="tab1" />,
    );
    expect(
      container.querySelector('[data-slot="easy-tabs"]'),
    ).toBeInTheDocument();
  });

  it("标签列表具有 data-slot 属性", () => {
    const { container } = render(
      <EasyTabContainer items={items} defaultValue="tab1" />,
    );
    expect(
      container.querySelector('[data-slot="easy-tabs-list"]'),
    ).toBeInTheDocument();
  });
});
