import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConfigProvider } from "../config-provider";
import { TimezoneSelect } from "../time-zone-select";
import { getSystemTimeZone } from "../../../lib/date-time-zone";

describe("TimezoneSelect", () => {
  it("reads the default timezone from ConfigProvider", () => {
    render(
      <ConfigProvider theme="light" timeZone="Asia/Shanghai">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    expect(screen.getByRole("button")).toHaveTextContent("UTC+08");
    expect(screen.getByRole("button")).toHaveTextContent("中国 · 上海");
    expect(screen.queryByRole("button", { name: "清空" })).not.toBeInTheDocument();
  });

  it("searches grouped timezone options and changes the uncontrolled value", async () => {
    const user = userEvent.setup();

    render(
      <ConfigProvider locale="zh-CN" theme="light" timeZone="Asia/Shanghai">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    await user.click(screen.getByRole("button"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("button")).toHaveLength(38);
    expect(within(dialog).getByText("亚洲")).toBeInTheDocument();
    expect(within(dialog).getByText("美洲")).toBeInTheDocument();
    expect(within(dialog).getByText("大洋洲")).toBeInTheDocument();

    const searchInput = within(dialog).getByPlaceholderText(
      "搜索时区、城市或 IANA 标识",
    );
    await user.type(searchInput, "上海");

    expect(
      within(dialog).getByRole("button", { name: /UTC\+08.*中国 · 上海/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /UTC\+07.*越南 · 胡志明市/ }),
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(
      within(dialog).getByRole("button", { name: /UTC\+07.*越南 · 胡志明市/ }),
    );

    expect(screen.getByRole("button")).toHaveTextContent("UTC+07");
    expect(screen.getByRole("button")).toHaveTextContent("越南 · 胡志明市");
  });

  it("shows the selected IANA zone instead of another city at the same offset", () => {
    render(
      <ConfigProvider locale="en-US" theme="light" timeZone="Asia/Bangkok">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    expect(screen.getByRole("button")).toHaveTextContent("UTC+07");
    expect(screen.getByRole("button")).toHaveTextContent("Asia/Bangkok");
    expect(screen.getByRole("button")).not.toHaveTextContent(
      "Vietnam · Ho Chi Minh",
    );
  });

  it("marks the timezone resolved from the browser environment", async () => {
    const user = userEvent.setup();

    render(
      <ConfigProvider locale="zh-CN" theme="light" timeZone="Asia/Shanghai">
        <TimezoneSelect />
      </ConfigProvider>,
    );

    await user.click(screen.getByRole("button"));

    expect(within(screen.getByRole("dialog")).getByText("当前时区")).toBeInTheDocument();
    expect(getSystemTimeZone()).toBeTruthy();
  });
});
