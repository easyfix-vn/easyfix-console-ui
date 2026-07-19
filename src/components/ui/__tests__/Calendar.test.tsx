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

  it("给当天标记保留文字间距并使用紧凑圆点", () => {
    const today = new Date(2026, 6, 18);
    render(<Calendar month={today} today={today} />);

    expect(document.querySelector("[data-today]")).toHaveClass(
      "*:after:bottom-0.5",
      "*:after:size-1",
    );
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

  it("跨月导航时保持完整六周并同步月份标题", async () => {
    const user = userEvent.setup();

    render(
      <EasyI18nProvider locale="zh-CN">
        <Calendar
          defaultMonth={new Date("2026-07-01T07:00:00.000Z")}
          timeZone="America/Los_Angeles"
        />
      </EasyI18nProvider>,
    );

    const nextButton = screen.getByRole("button", {
      name: "Go to the Next Month",
    });

    for (const caption of ["2026年7月", "2026年8月", "2026年9月"]) {
      expect(screen.getByRole("status")).toHaveTextContent(caption);
      expect(screen.getAllByRole("gridcell")).toHaveLength(42);

      if (caption !== "2026年9月") {
        await user.click(nextButton);
      }
    }
  });
});
