import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyLocaleSwitch, defaultEasyLocales } from "./EasyLocaleSwitch";

describe("EasyLocaleSwitch", () => {
  it("渲染默认的3个语言选项", () => {
    render(<EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  it("默认使用 pill 变体并按 vi、en、zh 排序", () => {
    const { container } = render(
      <EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} />,
    );
    const wrapper = container.querySelector(
      '[data-slot="easy-locale-switch"]',
    );
    const tabs = screen.getAllByRole("tab");

    expect(wrapper?.className).toContain("rounded-full");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "VI",
      "EN",
      "中文",
    ]);
  });

  it("显示每个语言的标签文字", () => {
    render(<EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} />);
    for (const locale of defaultEasyLocales) {
      expect(screen.getByText(locale.label)).toBeInTheDocument();
    }
  });

  it("点击其他语言按钮时调用 onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EasyLocaleSwitch value="zh-CN" onChange={onChange} />);
    await user.click(screen.getByText("EN"));
    expect(onChange).toHaveBeenCalledWith("en-US");
  });

  it("当前选中语言标记 aria-pressed 为 true", () => {
    render(<EasyLocaleSwitch value="en-US" onChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    const selected = tabs.filter(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("EN");
  });

  it("未选中语言标记 aria-selected 为 false", () => {
    render(<EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    const notSelected = tabs.filter(
      (tab) => tab.getAttribute("aria-selected") === "false",
    );
    expect(notSelected).toHaveLength(2);
  });

  it("pill 变体渲染正确的容器样式", () => {
    const { container } = render(
      <EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} variant="pill" />,
    );
    const wrapper = container.querySelector(
      '[data-slot="easy-locale-switch"]',
    );
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.className).toContain("rounded-full");
  });

  it("pill 变体中选中项有激活样式", () => {
    render(
      <EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} variant="pill" />,
    );
    const activeTab = screen.getByRole("tab", { selected: true });
    expect(activeTab).toHaveTextContent("中文");
  });

  it("default 变体仍使用按钮语义", () => {
    render(
      <EasyLocaleSwitch
        value="zh-CN"
        onChange={vi.fn()}
        variant="default"
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent(
      "中文",
    );
  });

  it("showLabel 为 false 时不显示标签文字", () => {
    render(
      <EasyLocaleSwitch
        value="zh-CN"
        onChange={vi.fn()}
        showLabel={false}
      />,
    );
    for (const locale of defaultEasyLocales) {
      expect(screen.queryByText(locale.label)).not.toBeInTheDocument();
    }
  });
});
