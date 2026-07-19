import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "../config-provider";
import { DateTimePicker } from "../date-time-picker";

const timeZone = "America/Los_Angeles";

function renderWithProvider(children: ReactNode) {
  return render(
    <ConfigProvider locale="zh-CN" theme="light" timeZone={timeZone}>
      {children}
    </ConfigProvider>,
  );
}

describe("DateTimePicker granularity", () => {
  it("selects a month immediately and emits the first day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProvider(
      <DateTimePicker
        defaultValue={new Date("2026-07-10T07:00:00.000Z")}
        onChange={onChange}
        showTimeZone={false}
        timeZone={timeZone}
        type="month"
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择月份" }));
    expect(screen.queryByRole("combobox", { name: "小时" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("gridcell", { name: "8月" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].toISOString()).toBe(
      "2026-08-01T07:00:00.000Z",
    );
    expect(screen.queryByRole("button", { name: "确定" })).not.toBeInTheDocument();
  });

  it("uses the month and year default display formats", () => {
    const { rerender } = renderWithProvider(
      <DateTimePicker
        showTimeZone={false}
        timeZone={timeZone}
        type="month"
        value={new Date("2026-08-01T07:00:00.000Z")}
      />,
    );

    expect(screen.getByRole("button", { name: /2026-08/ })).toBeInTheDocument();

    rerender(
      <ConfigProvider locale="zh-CN" theme="light" timeZone={timeZone}>
        <DateTimePicker
          showTimeZone={false}
          timeZone={timeZone}
          type="year"
          value={new Date("2026-01-01T08:00:00.000Z")}
        />
      </ConfigProvider>,
    );

    expect(screen.getByRole("button", { name: /2026/ })).toBeInTheDocument();
  });

  it("disables a month according to its emitted first day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProvider(
      <DateTimePicker
        defaultValue={new Date("2026-07-10T07:00:00.000Z")}
        disabledDate={(date) =>
          date.getFullYear() === 2026 &&
          date.getMonth() === 7 &&
          date.getDate() === 1
        }
        onChange={onChange}
        showTimeZone={false}
        timeZone={timeZone}
        type="month"
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择月份" }));
    const august = screen.getByRole("gridcell", { name: "8月" });
    expect(august).toBeDisabled();
    await user.click(august);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables a year according to January 1 and emits an enabled year", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProvider(
      <DateTimePicker
        defaultValue={new Date("2026-07-10T07:00:00.000Z")}
        disabledDate={(date) =>
          date.getFullYear() === 2026 &&
          date.getMonth() === 0 &&
          date.getDate() === 1
        }
        onChange={onChange}
        showTimeZone={false}
        timeZone={timeZone}
        type="year"
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择年份" }));
    expect(screen.getByRole("gridcell", { name: "2026" })).toBeDisabled();
    await user.click(screen.getByRole("gridcell", { name: "2025" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].toISOString()).toBe(
      "2025-01-01T08:00:00.000Z",
    );
  });
});
