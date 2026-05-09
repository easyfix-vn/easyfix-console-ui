import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "@/i18n";
import { Calendar } from "../calendar";

describe("Calendar", () => {
  it("渲染日历组件", () => {
    render(<Calendar />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("选择日期调用回调", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Calendar mode="single" onSelect={onSelect} />);
    const dayButtons = screen.getAllByRole("gridcell");
    const clickable = dayButtons.find(
      (cell) => cell.querySelector("button") !== null,
    );
    if (clickable) {
      await user.click(clickable.querySelector("button")!);
      expect(onSelect).toHaveBeenCalled();
    }
  });

  it("showOutsideDays 默认为 true 时显示外部日期", () => {
    render(<Calendar month={new Date(2024, 5, 1)} />);
    const outsideDays = document.querySelectorAll("[data-outside]");
    expect(outsideDays.length).toBeGreaterThan(0);
  });

  it("showOutsideDays 为 false 时隐藏外部日期", () => {
    render(<Calendar showOutsideDays={false} month={new Date(2024, 5, 1)} />);
    const outsideDays = document.querySelectorAll("[data-outside]");
    for (const day of outsideDays) {
      expect(day).toHaveAttribute("data-hidden");
    }
  });

  it("使用中文 locale 渲染", () => {
    render(
      <EasyI18nProvider locale="zh-CN">
        <Calendar month={new Date(2024, 0, 1)} />
      </EasyI18nProvider>,
    );
    expect(screen.getByText(/一月|1月/)).toBeInTheDocument();
  });

  it("切换为英文 locale 渲染", () => {
    render(
      <EasyI18nProvider locale="en-US">
        <Calendar month={new Date(2024, 0, 1)} />
      </EasyI18nProvider>,
    );
    expect(screen.getByText(/January/i)).toBeInTheDocument();
  });
});
