import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "../config-provider";
import { Calendar } from "../calendar";
import { DatePicker } from "../date-picker";
import { DateRangePicker } from "../date-range-picker";
import { DateTimePicker } from "../date-time-picker";

const timeZone = "America/Los_Angeles";

function renderWithProvider(children: ReactNode) {
  return render(
    <ConfigProvider locale="zh-CN" theme="light" timeZone={timeZone}>
      {children}
    </ConfigProvider>,
  );
}

function getFirstInsideDayButton(): HTMLButtonElement {
  const cell = screen.getAllByRole("gridcell").find((element) => {
    const button = element.querySelector("button");
    return button && !element.hasAttribute("data-outside");
  });

  const button = cell?.querySelector("button");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("No inside day button found");
  }

  return button;
}

describe("date pickers", () => {
  it("keeps the calendar caption and grid in the configured timezone", () => {
    renderWithProvider(
      <Calendar
        month={new Date("2026-07-01T07:00:00.000Z")}
        timeZone={timeZone}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("2026年7月");
    expect(screen.getByRole("grid")).toHaveAttribute("aria-label", "七月 2026");
  });

  it("only commits DatePicker selection after confirming", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProvider(
      <DatePicker
        value={new Date("2026-07-10T07:00:00.000Z")}
        onChange={onChange}
        showTimeZone={false}
        timeZone={timeZone}
      />,
    );

    await user.click(screen.getByRole("button", { name: /2026-07-10/ }));
    await user.click(
      screen.getByRole("button", { name: /2026年7月11日 星期六/ }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: /2026年7月11日 星期六, selected/,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]?.toISOString()).toBe(
      "2026-07-11T07:00:00.000Z",
    );
  });

  it("only commits DateTimePicker selection after confirming", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProvider(
      <DateTimePicker
        value={new Date("2026-07-10T15:30:00.000Z")}
        onChange={onChange}
        showTimeZone={false}
        timeZone={timeZone}
      />,
    );

    await user.click(screen.getByRole("button", { name: /2026-07-10 08:30/ }));
    await user.click(
      screen.getByRole("button", { name: /2026年7月12日 星期日/ }),
    );

    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]?.toISOString()).toBe(
      "2026-07-12T15:30:00.000Z",
    );
  });

  it("allows a same-day DateRangePicker range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProvider(
      <DateRangePicker
        onChange={onChange}
        shortcuts={false}
        showTimeZone={false}
        timeZone={timeZone}
        numberOfMonths={1}
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择日期范围" }));
    await user.click(getFirstInsideDayButton());

    const confirmButton = screen.getByRole("button", { name: "确定" });
    expect(confirmButton).not.toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(confirmButton);
    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0][0];
    expect(range.from).toBeInstanceOf(Date);
    expect(range.to).toBeInstanceOf(Date);
    expect(range.to.getTime() - range.from.getTime()).toBe(86_399_999);
  });
});
