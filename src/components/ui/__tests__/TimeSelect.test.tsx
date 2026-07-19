import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "../config-provider";
import { TimeSelect } from "../time-select";
import { generateTimeSelectOptions } from "../time-select-options";

describe("generateTimeSelectOptions", () => {
  it("generates inclusive fixed time points from start, end, and step", () => {
    expect(
      generateTimeSelectOptions({
        start: "08:30",
        end: "10:10",
        step: "00:45",
      }).map((option) => option.value),
    ).toEqual(["08:30", "09:15", "10:00"]);
  });

  it("returns no options for invalid or reversed configurations", () => {
    expect(
      generateTimeSelectOptions({
        start: "09:00",
        end: "08:00",
        step: "00:30",
      }),
    ).toEqual([]);
    expect(
      generateTimeSelectOptions({
        start: "09:00",
        end: "18:00",
        step: "00:00",
      }),
    ).toEqual([]);
  });

  it("keeps minTime and maxTime boundary options visible but disabled", () => {
    const options = generateTimeSelectOptions({
      start: "09:00",
      end: "11:00",
      step: "00:30",
      minTime: "09:00",
      maxTime: "11:00",
    });

    expect(options).toEqual([
      { value: "09:00", disabled: true },
      { value: "09:30", disabled: false },
      { value: "10:00", disabled: false },
      { value: "10:30", disabled: false },
      { value: "11:00", disabled: true },
    ]);
  });
});

describe("TimeSelect", () => {
  it("commits a generated time immediately and supports clearing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConfigProvider locale="zh-CN" theme="light" timeZone="UTC">
        <TimeSelect
          end="10:00"
          onChange={onChange}
          start="09:00"
          step="00:30"
        />
      </ConfigProvider>,
    );

    await user.click(screen.getByRole("combobox", { name: "选择时间" }));
    await user.click(screen.getByRole("option", { name: "09:30" }));
    expect(onChange).toHaveBeenLastCalledWith("09:30");

    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("regenerates the list when start, end, or step changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConfigProvider locale="zh-CN" theme="light" timeZone="UTC">
        <TimeSelect end="10:00" start="08:30" step="00:30" />
      </ConfigProvider>,
    );

    rerender(
      <ConfigProvider locale="zh-CN" theme="light" timeZone="UTC">
        <TimeSelect end="10:00" start="08:30" step="00:45" />
      </ConfigProvider>,
    );
    await user.click(screen.getByRole("combobox", { name: "选择时间" }));

    expect(
      screen.getByRole("option", { name: "09:15", hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "09:00", hidden: true }),
    ).toBeNull();
  });
});
