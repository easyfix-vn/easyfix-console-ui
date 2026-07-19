import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "@/i18n";
import {
  isTimeAllowed,
  parseSelectableRange,
  TimePickerPanel,
} from "../time-picker-panel";

describe("TimePickerPanel", () => {
  it("parses one or more inclusive selectable ranges", () => {
    expect(
      parseSelectableRange([
        "09:30:00 - 12:00:00",
        "14:30:00 - 18:30:00",
      ]),
    ).toEqual([
      [34_200, 43_200],
      [52_200, 66_600],
    ]);

    expect(
      isTimeAllowed(new Date(2026, 6, 1, 9, 30), {
        selectableRange: "09:30:00 - 12:00:00",
      }),
    ).toBe(true);
    expect(
      isTimeAllowed(new Date(2026, 6, 1, 9, 29), {
        selectableRange: "09:30:00 - 12:00:00",
      }),
    ).toBe(false);
  });

  it("combines selectableRange and disabledTime", () => {
    expect(
      isTimeAllowed(new Date(2026, 6, 1, 10, 30), {
        selectableRange: "09:00:00 - 18:00:00",
        disabledTime: () => ({ disabledHours: [10] }),
      }),
    ).toBe(false);
  });

  it("disables unavailable options and emits an allowed time", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { container } = render(
      <EasyI18nProvider locale="zh-CN">
        <TimePickerPanel
          value={new Date(2026, 6, 1, 9, 30)}
          onChange={onChange}
          minuteStep={30}
          selectableRange="09:30:00 - 10:30:00"
        />
      </EasyI18nProvider>,
    );

    const hourSelect = screen.getByRole("combobox", { name: "小时" });
    const minuteSelect = screen.getByRole("combobox", { name: "分钟" });
    expect(container.querySelector("select")).toBeNull();
    expect(hourSelect).toHaveTextContent("09");
    expect(minuteSelect).toHaveTextContent("30");
    expect(screen.queryByRole("button", { name: "清空" })).toBeNull();

    await user.click(hourSelect);
    expect(
      screen.getByRole("option", { name: "08", hidden: true }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("option", { name: "10" }));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0].getHours()).toBe(10);

    await user.click(minuteSelect);
    expect(
      screen
        .getAllByRole("option", { name: "00", hidden: true })
        .some((option) => option.getAttribute("aria-disabled") === "true"),
    ).toBe(true);
  });
});
