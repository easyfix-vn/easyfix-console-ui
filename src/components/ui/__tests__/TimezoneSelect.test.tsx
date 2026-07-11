import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConfigProvider } from "../config-provider";
import { TimezoneSelect } from "../time-zone-select";

describe("TimezoneSelect", () => {
  it("reads the default timezone from ConfigProvider", () => {
    render(
      <ConfigProvider theme="light" timeZone="Asia/Shanghai">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("UTC+08");
    expect(screen.getByRole("combobox")).toHaveTextContent("中国 · 上海");
  });

  it("renders all built-in offsets and changes the uncontrolled value", async () => {
    const user = userEvent.setup();

    render(
      <ConfigProvider locale="zh-CN" theme="light" timeZone="Asia/Shanghai">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    await user.click(screen.getByRole("combobox"));

    expect(screen.getAllByRole("option")).toHaveLength(38);
    await user.click(
      screen.getByRole("option", { name: /UTC\+07.*越南 · 胡志明市/ }),
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("UTC+07");
    expect(screen.getByRole("combobox")).toHaveTextContent("越南 · 胡志明市");
  });

  it("shows the selected IANA zone instead of another city at the same offset", () => {
    render(
      <ConfigProvider locale="en-US" theme="light" timeZone="Asia/Bangkok">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("UTC+07");
    expect(screen.getByRole("combobox")).toHaveTextContent("Asia/Bangkok");
    expect(screen.getByRole("combobox")).not.toHaveTextContent(
      "Vietnam · Ho Chi Minh",
    );
  });
});
