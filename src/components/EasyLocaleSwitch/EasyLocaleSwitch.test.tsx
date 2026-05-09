import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyLocaleSwitch, defaultEasyLocales } from "./EasyLocaleSwitch";

describe("EasyLocaleSwitch", () => {
  it("渲染默认的3个语言选项", () => {
    render(<EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
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
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (btn) => btn.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent("EN");
  });

  it("未选中语言标记 aria-pressed 为 false", () => {
    render(<EasyLocaleSwitch value="zh-CN" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    const notPressed = buttons.filter(
      (btn) => btn.getAttribute("aria-pressed") === "false",
    );
    expect(notPressed).toHaveLength(2);
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
    const activeBtn = screen.getByRole("button", { pressed: true });
    expect(activeBtn.className).toContain("bg-background");
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
