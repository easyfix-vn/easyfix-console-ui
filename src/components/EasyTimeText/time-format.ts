"use client";

export type EasyTimeValue = string | number | Date | null | undefined;

export type EasyTimeTextValue = EasyTimeValue | EasyTimeValue[];

export type EasyTimeTextFormat =
  | "datetime"
  | "date"
  | "time"
  | (string & {});

export interface EasyTimeTextFormatOptions {
  /** IANA 时区或常见时区缩写，如 Asia/Ho_Chi_Minh、UTC、ICT、CST */
  timeZone?: string;
  /** Intl locale，默认 en-CA，便于稳定输出 YYYY-MM-DD */
  locale?: string;
  /** 输出格式，默认 datetime */
  format?: EasyTimeTextFormat;
  /** 是否使用 12 小时制，默认 false */
  hour12?: boolean;
  /** 是否展示 UTC+时区偏移，默认 true */
  showTimeZone?: boolean;
  /** 空值展示文本，默认 "-" */
  emptyText?: string;
  /** 同日区间分隔符，默认 " - " */
  rangeSeparator?: string;
  /** 多日期分组分隔符，默认 "; " */
  groupSeparator?: string;
}

export const EASY_TIME_ZONE_ABBREVIATIONS: Record<string, string> = {
  UTC: "UTC",
  GMT: "UTC",
  ICT: "Asia/Ho_Chi_Minh",
  CST: "Asia/Shanghai",
  HKT: "Asia/Hong_Kong",
  SGT: "Asia/Singapore",
  JST: "Asia/Tokyo",
  KST: "Asia/Seoul",
  IST: "Asia/Kolkata",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  MST: "America/Denver",
  MDT: "America/Denver",
  EST: "America/New_York",
  EDT: "America/New_York",
  BST: "Europe/London",
  CET: "Europe/Paris",
  CEST: "Europe/Paris",
};

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

function getEnvironmentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone?: string): string {
  const candidate = timeZone?.trim();

  if (candidate) {
    const upperCandidate = candidate.toUpperCase();
    const mappedTimeZone = EASY_TIME_ZONE_ABBREVIATIONS[upperCandidate];

    if (mappedTimeZone) {
      return mappedTimeZone;
    }

    if (isValidTimeZone(candidate)) {
      return candidate;
    }
  }

  const environmentTimeZone = getEnvironmentTimeZone();
  return isValidTimeZone(environmentTimeZone) ? environmentTimeZone : "UTC";
}

export function getTimeZoneLabel(
  timeZone?: string,
  resolvedTimeZone = resolveTimeZone(timeZone),
  locale = "en-US",
  date = new Date(),
): string {
  return getTimeZoneOffsetLabel(timeZone, resolvedTimeZone, locale, date);
}

function getTimeZoneOffsetMinutes(
  timeZone: string,
  date: Date,
  locale: string,
): number | undefined {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "0";
    const year = Number(getPart("year"));
    const month = Number(getPart("month"));
    const day = Number(getPart("day"));
    const hour = Number(getPart("hour")) % 24;
    const minute = Number(getPart("minute"));
    const second = Number(getPart("second"));
    const zonedTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);

    return Math.round((zonedTimestamp - date.getTime()) / 60_000);
  } catch {
    return undefined;
  }
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

export function getTimeZoneOffsetLabel(
  timeZone?: string,
  resolvedTimeZone = resolveTimeZone(timeZone),
  locale = "en-US",
  date = new Date(),
): string {
  const offsetMinutes = getTimeZoneOffsetMinutes(resolvedTimeZone, date, locale);
  return offsetMinutes === undefined
    ? resolvedTimeZone
    : formatOffsetMinutes(offsetMinutes);
}

function parseTimestamp(value: number): Date | undefined {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  const milliseconds =
    Math.abs(value) < 100_000_000_000 ? value * 1000 : value;
  const date = new Date(milliseconds);

  return isValidDate(date) ? date : undefined;
}

export function parseEasyTimeValue(value: EasyTimeValue): Date | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? value : undefined;
  }

  if (typeof value === "number") {
    return parseTimestamp(value);
  }

  const text = String(value).trim();

  if (!text) {
    return undefined;
  }

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return parseTimestamp(Number(text));
  }

  const date = new Date(text);
  return isValidDate(date) ? date : undefined;
}

function normalizeTimeValues(value: EasyTimeTextValue | undefined): Date[] {
  const values = Array.isArray(value) ? value : [value];

  return values
    .map(parseEasyTimeValue)
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => left.getTime() - right.getTime());
}

function getDateTimeParts({
  date,
  timeZone,
  locale,
  hour12,
}: {
  date: Date;
  timeZone: string;
  locale: string;
  hour12: boolean;
}): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour") === "24" ? "00" : getPart("hour");
  const minute = getPart("minute");
  const dayPeriod = hour12 ? getPart("dayPeriod") : "";

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ""}`,
  };
}

function formatZonedTemplate(
  date: Date,
  timeZone: string,
  locale: string,
  hour12: boolean,
  template: string,
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = getPart("hour") === "24" ? "00" : getPart("hour");
  const values: Record<string, string> = {
    YYYY: getPart("year"),
    YY: getPart("year").slice(-2),
    MM: getPart("month"),
    M: String(Number(getPart("month"))),
    DD: getPart("day"),
    D: String(Number(getPart("day"))),
    HH: hour,
    H: String(Number(hour)),
    mm: getPart("minute"),
    m: String(Number(getPart("minute"))),
    ss: getPart("second"),
    s: String(Number(getPart("second"))),
    A: getPart("dayPeriod"),
  };

  return template.replace(
    /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|A/g,
    (token) => values[token] ?? token,
  );
}

function appendTimeZone(
  value: string,
  showTimeZone: boolean,
  timeZoneLabel: string,
): string {
  return showTimeZone && timeZoneLabel ? `${value} ${timeZoneLabel}` : value;
}

function formatSingleTimeValue({
  date,
  timeZone,
  locale,
  format,
  hour12,
  showTimeZone,
  timeZoneLabel,
}: {
  date: Date;
  timeZone: string;
  locale: string;
  format: EasyTimeTextFormat;
  hour12: boolean;
  showTimeZone: boolean;
  timeZoneLabel: string;
}): string {
  const parts = getDateTimeParts({ date, timeZone, locale, hour12 });

  if (format === "date") {
    return parts.date;
  }

  if (format === "time") {
    return appendTimeZone(parts.time, showTimeZone, timeZoneLabel);
  }

  if (format !== "datetime") {
    return appendTimeZone(
      formatZonedTemplate(date, timeZone, locale, hour12, format),
      showTimeZone,
      timeZoneLabel,
    );
  }

  return appendTimeZone(
    `${parts.date} ${parts.time}`,
    showTimeZone,
    timeZoneLabel,
  );
}

export function formatTimeText(
  value: EasyTimeTextValue | undefined,
  {
    timeZone,
    locale = "en-CA",
    format = "datetime",
    hour12 = false,
    showTimeZone = true,
    emptyText = "-",
    rangeSeparator = " - ",
    groupSeparator = "; ",
  }: EasyTimeTextFormatOptions = {},
): string {
  const dates = normalizeTimeValues(value);

  if (dates.length === 0) {
    return emptyText;
  }

  const resolvedTimeZone = resolveTimeZone(timeZone);
  const timeZoneLabel = getTimeZoneLabel(
    timeZone,
    resolvedTimeZone,
    locale,
    dates[0],
  );

  if (dates.length === 1) {
    return formatSingleTimeValue({
      date: dates[0],
      timeZone: resolvedTimeZone,
      locale,
      format,
      hour12,
      showTimeZone,
      timeZoneLabel,
    });
  }

  const dateGroups = new Map<string, Date[]>();

  dates.forEach((date) => {
    const dateKey = getDateTimeParts({
      date,
      timeZone: resolvedTimeZone,
      locale,
      hour12,
    }).date;
    const group = dateGroups.get(dateKey) ?? [];

    group.push(date);
    dateGroups.set(dateKey, group);
  });

  return Array.from(dateGroups.entries())
    .map(([dateKey, group]) => {
      if (format === "date") {
        return dateKey;
      }

      if (format !== "datetime" && format !== "time") {
        const rangeText = group
          .map((date) =>
            formatZonedTemplate(date, resolvedTimeZone, locale, hour12, format),
          )
          .join(rangeSeparator);
        return appendTimeZone(rangeText, showTimeZone, timeZoneLabel);
      }

      if (group.length === 1) {
        return formatSingleTimeValue({
          date: group[0],
          timeZone: resolvedTimeZone,
          locale,
          format,
          hour12,
          showTimeZone,
          timeZoneLabel,
        });
      }

      const first = group[0];
      const last = group[group.length - 1];
      const firstParts = getDateTimeParts({
        date: first,
        timeZone: resolvedTimeZone,
        locale,
        hour12,
      });
      const lastParts = getDateTimeParts({
        date: last,
        timeZone: resolvedTimeZone,
        locale,
        hour12,
      });
      const rangeText =
        format === "time"
          ? `${firstParts.time}${rangeSeparator}${lastParts.time}`
          : `${dateKey} ${firstParts.time}${rangeSeparator}${lastParts.time}`;

      return appendTimeZone(rangeText, showTimeZone, timeZoneLabel);
    })
    .join(groupSeparator);
}
