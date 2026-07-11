import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EasyTimeText } from "./EasyTimeText";
import {
  formatTimeText,
  parseEasyTimeValue,
  resolveTimeZone,
} from "./time-format";

describe("EasyTimeText", () => {
  it("renders a timestamp with timezone label", () => {
    render(
      <EasyTimeText
        value={Date.UTC(2026, 0, 1, 1, 30)}
        timeZone="UTC"
      />,
    );

    expect(screen.getByText("2026-01-01 01:30 UTC+00")).toBeInTheDocument();
  });

  it("auto-detects second and millisecond timestamps", () => {
    const milliseconds = Date.UTC(2026, 0, 1, 1, 30);
    const seconds = milliseconds / 1000;

    expect(
      formatTimeText(seconds, { timeZone: "UTC", showTimeZone: false }),
    ).toBe("2026-01-01 01:30");
    expect(
      formatTimeText(milliseconds, { timeZone: "UTC", showTimeZone: false }),
    ).toBe("2026-01-01 01:30");
  });

  it("maps common timezone abbreviations", () => {
    expect(resolveTimeZone("ICT")).toBe("Asia/Ho_Chi_Minh");
    expect(
      formatTimeText(Date.UTC(2026, 0, 1, 1, 30), { timeZone: "ICT" }),
    ).toBe("2026-01-01 08:30 UTC+07");
  });

  it("merges timestamps on the same local date into a range", () => {
    expect(
      formatTimeText(
        [Date.UTC(2026, 0, 1, 1, 0), Date.UTC(2026, 0, 1, 3, 30)],
        { timeZone: "UTC" },
      ),
    ).toBe("2026-01-01 01:00 - 03:30 UTC+00");
  });

  it("keeps separate dates as separate groups", () => {
    expect(
      formatTimeText(
        ["2026-01-01T01:00:00Z", "2026-01-02T02:15:00Z"],
        { timeZone: "UTC" },
      ),
    ).toBe("2026-01-01 01:00 UTC+00; 2026-01-02 02:15 UTC+00");
  });

  it("applies text size classes", () => {
    render(
      <EasyTimeText
        value={Date.UTC(2026, 0, 1, 1, 30)}
        timeZone="UTC"
        size="lg"
      />,
    );

    expect(screen.getByText("2026-01-01 01:30 UTC+00")).toHaveAttribute(
      "data-size",
      "lg",
    );
  });

  it("parses formatted time strings", () => {
    expect(parseEasyTimeValue("2026-01-01T01:30:00Z")?.toISOString()).toBe(
      "2026-01-01T01:30:00.000Z",
    );
  });

  it("supports custom date and time tokens", () => {
    expect(
      formatTimeText(Date.UTC(2026, 0, 1, 1, 30, 45), {
        timeZone: "Asia/Ho_Chi_Minh",
        format: "YYYY年MM月DD日 HH:mm:ss",
      }),
    ).toBe("2026年01月01日 08:30:45 UTC+07");
  });
});
