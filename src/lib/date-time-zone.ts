"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type * as React from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

/** IANA time zone identifier, for example `Asia/Shanghai` or `UTC`. */
export type IanaTimeZone = string;

export type TimeZoneOption = {
  value: IanaTimeZone;
  label?: string;
  description?: string;
  offset?: string;
  nameKey?: string;
};

export type TimeZoneDefinition = {
  value: IanaTimeZone;
  offset: string;
  nameKey: string;
};

export type TimestampRangeValue = {
  from?: number;
  to?: number;
};

export type DateRangeShortcutContext = {
  timeZone: IanaTimeZone;
  now: dayjs.Dayjs;
};

export type DateRangeShortcut = {
  label: React.ReactNode;
  getRange: (context: DateRangeShortcutContext) => {
    from?: Date;
    to?: Date;
  } | undefined;
};

export const DEFAULT_TIME_ZONE_DEFINITIONS: TimeZoneDefinition[] = [
  { value: "Etc/GMT+12", offset: "UTC-12", nameKey: "utcMinus12" },
  { value: "Pacific/Pago_Pago", offset: "UTC-11", nameKey: "utcMinus11" },
  { value: "Pacific/Honolulu", offset: "UTC-10", nameKey: "utcMinus10" },
  { value: "Pacific/Marquesas", offset: "UTC-09:30", nameKey: "utcMinus9_30" },
  { value: "America/Adak", offset: "UTC-09", nameKey: "utcMinus9" },
  { value: "Pacific/Pitcairn", offset: "UTC-08", nameKey: "utcMinus8" },
  { value: "America/Phoenix", offset: "UTC-07", nameKey: "utcMinus7" },
  { value: "America/Guatemala", offset: "UTC-06", nameKey: "utcMinus6" },
  { value: "America/Bogota", offset: "UTC-05", nameKey: "utcMinus5" },
  { value: "America/Caracas", offset: "UTC-04", nameKey: "utcMinus4" },
  { value: "America/Argentina/Buenos_Aires", offset: "UTC-03", nameKey: "utcMinus3" },
  { value: "America/St_Johns", offset: "UTC-02:30", nameKey: "utcMinus2_30" },
  { value: "America/Noronha", offset: "UTC-02", nameKey: "utcMinus2" },
  { value: "Atlantic/Cape_Verde", offset: "UTC-01", nameKey: "utcMinus1" },
  { value: "UTC", offset: "UTC+00", nameKey: "utc" },
  { value: "Africa/Lagos", offset: "UTC+01", nameKey: "utcPlus1" },
  { value: "Africa/Johannesburg", offset: "UTC+02", nameKey: "utcPlus2" },
  { value: "Africa/Nairobi", offset: "UTC+03", nameKey: "utcPlus3" },
  { value: "Asia/Tehran", offset: "UTC+03:30", nameKey: "utcPlus3_30" },
  { value: "Asia/Dubai", offset: "UTC+04", nameKey: "utcPlus4" },
  { value: "Asia/Kabul", offset: "UTC+04:30", nameKey: "utcPlus4_30" },
  { value: "Asia/Karachi", offset: "UTC+05", nameKey: "utcPlus5" },
  { value: "Asia/Kolkata", offset: "UTC+05:30", nameKey: "utcPlus5_30" },
  { value: "Asia/Kathmandu", offset: "UTC+05:45", nameKey: "utcPlus5_45" },
  { value: "Asia/Dhaka", offset: "UTC+06", nameKey: "utcPlus6" },
  { value: "Asia/Yangon", offset: "UTC+06:30", nameKey: "utcPlus6_30" },
  { value: "Asia/Ho_Chi_Minh", offset: "UTC+07", nameKey: "utcPlus7" },
  { value: "Asia/Shanghai", offset: "UTC+08", nameKey: "utcPlus8" },
  { value: "Australia/Eucla", offset: "UTC+08:45", nameKey: "utcPlus8_45" },
  { value: "Asia/Tokyo", offset: "UTC+09", nameKey: "utcPlus9" },
  { value: "Australia/Darwin", offset: "UTC+09:30", nameKey: "utcPlus9_30" },
  { value: "Australia/Brisbane", offset: "UTC+10", nameKey: "utcPlus10" },
  { value: "Australia/Lord_Howe", offset: "UTC+10:30", nameKey: "utcPlus10_30" },
  { value: "Pacific/Noumea", offset: "UTC+11", nameKey: "utcPlus11" },
  { value: "Pacific/Tarawa", offset: "UTC+12", nameKey: "utcPlus12" },
  { value: "Pacific/Chatham", offset: "UTC+12:45", nameKey: "utcPlus12_45" },
  { value: "Pacific/Tongatapu", offset: "UTC+13", nameKey: "utcPlus13" },
  { value: "Pacific/Kiritimati", offset: "UTC+14", nameKey: "utcPlus14" },
];

export const DEFAULT_TIME_ZONE_OPTIONS: TimeZoneOption[] =
  DEFAULT_TIME_ZONE_DEFINITIONS.map((definition) => ({
    ...definition,
  }));

export function getSystemTimeZone(): string {
  try {
    return dayjs.tz.guess() || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidDateTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function normalizeDateTimeZone(timeZone?: string): string {
  if (timeZone && isValidDateTimeZone(timeZone)) {
    return timeZone;
  }

  const systemTimeZone = getSystemTimeZone();
  return isValidDateTimeZone(systemTimeZone) ? systemTimeZone : "UTC";
}

export function getTimeZoneOptions(
  options: TimeZoneOption[] | undefined,
  currentTimeZone: string,
): TimeZoneOption[] {
  const baseOptions = options?.length ? options : DEFAULT_TIME_ZONE_OPTIONS;
  const hasCurrent = baseOptions.some(
    (option) => option.value === currentTimeZone,
  );

  if (hasCurrent) {
    return baseOptions;
  }

  // Keep the default menu at one representative option per offset while
  // preserving the browser's exact IANA zone as the selected value.
  if (!options?.length) {
    const currentOffset = getDateTimeZoneTag(currentTimeZone);
    const sameOffsetIndex = baseOptions.findIndex(
      (option) => getTimeZoneOptionTag(option) === currentOffset,
    );

    if (sameOffsetIndex >= 0) {
      return baseOptions.map((option, index) =>
        index === sameOffsetIndex
          ? {
              value: currentTimeZone,
              offset: currentOffset,
              description: currentTimeZone,
            }
          : option,
      );
    }
  }

  return [
    { value: currentTimeZone, description: currentTimeZone },
    ...baseOptions,
  ];
}

export function getDateTimeZoneTag(timeZone: string, date = new Date()): string {
  return getDateTimeZoneOffsetLabel(timeZone, date);
}

export function getTimeZoneOptionTag(
  option: Pick<TimeZoneOption, "offset" | "value">,
  date = new Date(),
): string {
  return option.offset ?? getDateTimeZoneTag(option.value, date);
}

function formatOffsetMinutes(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteOffset / 60);
  const minutes = absoluteOffset % 60;

  if (minutes === 0) {
    return `UTC${sign}${String(hours).padStart(2, "0")}`;
  }

  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getIntlOffsetMinutes(timeZone: string, date: Date): number | undefined {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const values = new Map(parts.map((part) => [part.type, part.value]));
    const year = Number(values.get("year"));
    const month = Number(values.get("month"));
    const day = Number(values.get("day"));
    const hour = Number(values.get("hour")) % 24;
    const minute = Number(values.get("minute"));
    const second = Number(values.get("second"));

    if ([year, month, day, hour, minute, second].some(Number.isNaN)) {
      return undefined;
    }

    return Math.round(
      (Date.UTC(year, month - 1, day, hour, minute, second) - date.getTime()) /
        60000,
    );
  } catch {
    return undefined;
  }
}

export function getDateTimeZoneOffsetLabel(
  timeZone: string,
  date = new Date(),
): string {
  const intlOffset = getIntlOffsetMinutes(timeZone, date);
  if (intlOffset !== undefined) {
    return formatOffsetMinutes(intlOffset);
  }

  try {
    return formatOffsetMinutes(dayjs(date).tz(timeZone).utcOffset());
  } catch {
    return timeZone;
  }
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function toDateTimeText(date: Date): string {
  return [
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join(" ");
}

export function toZonedCalendarDate(
  value: Date | undefined,
  timeZone: string,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const zoned = dayjs(value).tz(timeZone);
  return new Date(
    zoned.year(),
    zoned.month(),
    zoned.date(),
    zoned.hour(),
    zoned.minute(),
    zoned.second(),
    zoned.millisecond(),
  );
}

export function calendarDateToZonedDate(
  date: Date,
  timeZone: string,
  boundary: "startOfDay" | "endOfDay" | "dateTime" = "dateTime",
): Date {
  let source = date;

  if (boundary === "startOfDay") {
    source = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  if (boundary === "endOfDay") {
    source = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  return dayjs.tz(toDateTimeText(source), timeZone).toDate();
}

export function getZonedTimestamp(
  date: Date | undefined,
  timeZone: string,
  boundary: "startOfDay" | "endOfDay" | "dateTime" = "dateTime",
): number | undefined {
  if (!date) {
    return undefined;
  }

  return calendarDateToZonedDate(date, timeZone, boundary).getTime();
}

export function applyCalendarTime(base: Date, time: string): Date {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hours || 0,
    minutes || 0,
    seconds || 0,
    0,
  );
}

export function toCalendarTimeString(
  date: Date | undefined,
  showSeconds = false,
): string {
  if (!date) {
    return "";
  }

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return showSeconds ? `${time}:${pad(date.getSeconds())}` : time;
}

export function getTimestampRange(
  range: { from?: Date; to?: Date } | undefined,
  timeZone: string,
): TimestampRangeValue | undefined {
  if (!range?.from && !range?.to) {
    return undefined;
  }

  return {
    from: range.from?.getTime() ?? getZonedTimestamp(range.from, timeZone),
    to: range.to?.getTime() ?? getZonedTimestamp(range.to, timeZone),
  };
}

export function createDefaultDateRangeShortcuts(
  labels: {
    today: React.ReactNode;
    yesterday: React.ReactNode;
    last3Days: React.ReactNode;
    last7Days: React.ReactNode;
    previousWeek: React.ReactNode;
    thisMonth: React.ReactNode;
  },
): DateRangeShortcut[] {
  const startOfLocalWeek = (now: dayjs.Dayjs) => {
    const daysSinceMonday = (now.day() + 6) % 7;
    return now.subtract(daysSinceMonday, "day").startOf("day");
  };

  return [
    {
      label: labels.today,
      getRange: ({ now }) => ({
        from: now.startOf("day").toDate(),
        to: now.endOf("day").toDate(),
      }),
    },
    {
      label: labels.yesterday,
      getRange: ({ now }) => {
        const day = now.subtract(1, "day");
        return {
          from: day.startOf("day").toDate(),
          to: day.endOf("day").toDate(),
        };
      },
    },
    {
      label: labels.last3Days,
      getRange: ({ now }) => ({
        from: now.subtract(2, "day").startOf("day").toDate(),
        to: now.endOf("day").toDate(),
      }),
    },
    {
      label: labels.last7Days,
      getRange: ({ now }) => ({
        from: now.subtract(6, "day").startOf("day").toDate(),
        to: now.endOf("day").toDate(),
      }),
    },
    {
      label: labels.previousWeek,
      getRange: ({ now }) => {
        const currentWeekStart = startOfLocalWeek(now);
        return {
          from: currentWeekStart.subtract(7, "day").toDate(),
          to: currentWeekStart.subtract(1, "millisecond").toDate(),
        };
      },
    },
    {
      label: labels.thisMonth,
      getRange: ({ now }) => ({
        from: now.startOf("month").toDate(),
        to: now.endOf("day").toDate(),
      }),
    },
  ];
}

export { dayjs };
