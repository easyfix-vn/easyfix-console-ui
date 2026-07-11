import { describe, expect, it } from "vitest";
import {
  calendarDateToZonedDate,
  createDefaultDateRangeShortcuts,
  dayjs,
  DEFAULT_TIME_ZONE_OPTIONS,
  getDateTimeZoneTag,
  getTimeZoneOptions,
  toZonedCalendarDate,
} from "./date-time-zone";

describe("date-time-zone", () => {
  it("converts a calendar date start to a timezone timestamp", () => {
    const date = calendarDateToZonedDate(
      new Date(2026, 0, 1),
      "Asia/Ho_Chi_Minh",
      "startOfDay",
    );

    expect(date.toISOString()).toBe("2025-12-31T17:00:00.000Z");
  });

  it("formats timezone tags as UTC offsets", () => {
    expect(getDateTimeZoneTag("Asia/Ho_Chi_Minh")).toBe("UTC+07");
    expect(getDateTimeZoneTag("Asia/Shanghai")).toBe("UTC+08");
  });

  it("provides representative IANA zones from UTC-12 through UTC+14", () => {
    const expectedOffsets = [
      "UTC-12",
      "UTC-11",
      "UTC-10",
      "UTC-09:30",
      "UTC-09",
      "UTC-08",
      "UTC-07",
      "UTC-06",
      "UTC-05",
      "UTC-04",
      "UTC-03",
      "UTC-02:30",
      "UTC-02",
      "UTC-01",
      "UTC+00",
      "UTC+01",
      "UTC+02",
      "UTC+03",
      "UTC+03:30",
      "UTC+04",
      "UTC+04:30",
      "UTC+05",
      "UTC+05:30",
      "UTC+05:45",
      "UTC+06",
      "UTC+06:30",
      "UTC+07",
      "UTC+08",
      "UTC+08:45",
      "UTC+09",
      "UTC+09:30",
      "UTC+10",
      "UTC+10:30",
      "UTC+11",
      "UTC+12",
      "UTC+12:45",
      "UTC+13",
      "UTC+14",
    ];
    const actualOffsets = DEFAULT_TIME_ZONE_OPTIONS.map((option) =>
      getDateTimeZoneTag(option.value, new Date("2026-07-11T12:00:00Z")),
    );

    expect(actualOffsets).toEqual(expectedOffsets);
  });

  it("keeps the current browser zone without adding a duplicate offset row", () => {
    const options = getTimeZoneOptions(undefined, "America/New_York");

    expect(options).toHaveLength(DEFAULT_TIME_ZONE_OPTIONS.length);
    expect(options.filter((option) => option.value === "America/New_York")).toHaveLength(1);
    expect(new Set(options.map((option) => option.value)).size).toBe(options.length);
  });

  it("uses the last millisecond for date range end dates", () => {
    const date = calendarDateToZonedDate(
      new Date(2026, 0, 1),
      "Asia/Ho_Chi_Minh",
      "endOfDay",
    );

    expect(date.toISOString()).toBe("2026-01-01T16:59:59.999Z");
  });

  it("converts an instant back to the calendar date in timezone", () => {
    const calendarDate = toZonedCalendarDate(
      new Date("2025-12-31T17:00:00.000Z"),
      "Asia/Ho_Chi_Minh",
    );

    expect(calendarDate?.getFullYear()).toBe(2026);
    expect(calendarDate?.getMonth()).toBe(0);
    expect(calendarDate?.getDate()).toBe(1);
  });

  it("creates default shortcut ranges in the provided timezone", () => {
    const shortcuts = createDefaultDateRangeShortcuts({
      today: "今天",
      yesterday: "昨天",
      last3Days: "近3天",
      last7Days: "近一周",
      previousWeek: "上周",
      thisMonth: "本月",
    });
    const today = shortcuts[0].getRange({
      timeZone: "UTC",
      now: dayjs.tz("2026-07-11 12:00:00", "UTC"),
    });

    expect(today?.from?.toISOString()).toBe("2026-07-11T00:00:00.000Z");
    expect(today?.to?.toISOString()).toBe("2026-07-11T23:59:59.999Z");
  });
});
