import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "../config-provider";
import { TimePicker, TimeRangePicker } from "../time-picker";

function renderPicker(element: ReactElement) {
  return render(
    <ConfigProvider locale="zh-CN" theme="light" timeZone="UTC">
      {element}
    </ConfigProvider>,
  );
}

describe("TimePicker", () => {
  it("initializes from defaultTime and only commits after confirmation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPicker(
      <TimePicker
        defaultTime="09:30:00"
        onChange={onChange}
        showTimeZone={false}
        timeZone="UTC"
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择时间" }));
    expect(screen.getByRole("combobox", { name: "小时" })).toHaveTextContent(
      "09",
    );
    expect(screen.queryByRole("button", { name: "清空" })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getUTCHours()).toBe(9);
    expect(onChange.mock.calls[0][0].getUTCMinutes()).toBe(30);
  });

  it("moves an invalid default into the first selectable range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPicker(
      <TimePicker
        defaultTime="00:00:00"
        onChange={onChange}
        selectableRange="09:30:00 - 10:00:00"
        showTimeZone={false}
        timeZone="UTC"
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择时间" }));
    expect(screen.getByRole("combobox", { name: "小时" })).toHaveTextContent(
      "09",
    );
    expect(screen.getByRole("combobox", { name: "分钟" })).toHaveTextContent(
      "30",
    );
  });
});

describe("TimeRangePicker", () => {
  it("prevents an end time earlier than the start time", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPicker(
      <TimeRangePicker
        defaultTime={["09:00:00", "18:00:00"]}
        onChange={onChange}
        showTimeZone={false}
        timeZone="UTC"
      />,
    );

    await user.click(screen.getByRole("button", { name: "选择时间范围" }));
    const hourSelects = screen.getAllByRole("combobox", { name: "小时" });
    await user.click(hourSelects[1]);
    await user.click(screen.getByRole("option", { name: "08" }));

    expect(screen.getByRole("button", { name: "确定" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "选择时间范围" }));
    await user.click(screen.getByRole("button", { name: "选择时间范围" }));
    await user.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
