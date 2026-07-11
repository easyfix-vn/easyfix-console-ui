"use client";

import { CalendarIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useEasyI18n, useEasyT } from "@/i18n";
import { useConfig } from "@/components/ui/config-provider";
import {
  DEFAULT_DATE_TEMPLATES,
  DEFAULT_DATETIME_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { TimezoneSelect, TimeZoneTag } from "@/components/ui/time-zone-select";
import {
  applyCalendarTime,
  calendarDateToZonedDate,
  createDefaultDateRangeShortcuts,
  dayjs,
  getTimestampRange,
  normalizeDateTimeZone,
  toCalendarTimeString,
  toZonedCalendarDate,
  type DateRangeShortcut,
  type TimeZoneOption,
  type TimestampRangeValue,
} from "@/lib/date-time-zone";

/* ------------------------------------------------------------------ */
/* 共享类型                                                             */
/* ------------------------------------------------------------------ */

export type DateRangeValue = { from?: Date; to?: Date };

/* ------------------------------------------------------------------ */
/* TimeInput（内部，与 date-time-picker 保持一致的样式）               */
/* ------------------------------------------------------------------ */

type TimeInputProps = {
  label?: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
};

function TimeInput({ label, value, onChange, disabled }: TimeInputProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground shadow-xs/5 ring-ring/24 transition-shadow focus-within:border-ring focus-within:ring-[3px]",
        disabled && "opacity-64",
      )}
    >
      <ClockIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-w-[5.5rem] bg-transparent text-foreground tabular-nums outline-none placeholder:text-muted-foreground accent-primary",
          "[&::-webkit-calendar-picker-indicator]:hidden",
          "[color-scheme:light] dark:[color-scheme:dark]",
        )}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* DateRangePicker                                                      */
/* ------------------------------------------------------------------ */

export type DateRangePickerProps = {
  /** 是否显示时间输入，开启后可同时选择起止时间 */
  showTime?: boolean;
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue | undefined) => void;
  /** 选中范围按指定时区转换为时间戳后回调，单位毫秒 */
  onTimestampChange?: (range: TimestampRangeValue | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** IANA 时区；未传时读取 ConfigProvider.timeZone 或浏览器时区 */
  timeZone?: string;
  defaultTimeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
  timeZoneOptions?: TimeZoneOption[];
  showTimeZone?: boolean;
  /** 快捷日期范围；传 false 可隐藏默认快捷项 */
  shortcuts?: DateRangeShortcut[] | false;
  /** 格式化模板，同 DatePicker.format */
  format?: DateFormatter;
  /** 起止之间的分隔符；默认根据 locale 取 i18n 文案 datePicker.separator */
  separator?: React.ReactNode;
  /** 同时展示的月份数量；默认 2 */
  numberOfMonths?: number;
};

export function DateRangePicker({
  showTime = false,
  value,
  onChange,
  onTimestampChange,
  placeholder,
  disabled = false,
  className,
  timeZone,
  defaultTimeZone,
  onTimeZoneChange,
  timeZoneOptions,
  showTimeZone = true,
  shortcuts,
  format,
  separator,
  numberOfMonths = 2,
}: DateRangePickerProps): React.ReactElement {
  const { timeZone: configTimeZone } = useConfig();
  const [open, setOpen] = React.useState(false);
  const [pendingRange, setPendingRange] = React.useState<
    DateRangeValue | undefined
  >(value);
  const [internalTimeZone, setInternalTimeZone] = React.useState(() =>
    normalizeDateTimeZone(defaultTimeZone ?? configTimeZone),
  );
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const resolvedTimeZone = normalizeDateTimeZone(timeZone ?? internalTimeZone);

  React.useEffect(() => {
    if (timeZone === undefined) {
      setInternalTimeZone(
        normalizeDateTimeZone(defaultTimeZone ?? configTimeZone),
      );
    }
  }, [configTimeZone, defaultTimeZone, timeZone]);

  const isDatetime = showTime;
  const templates = isDatetime ? DEFAULT_DATETIME_TEMPLATES : DEFAULT_DATE_TEMPLATES;

  const formatter = React.useMemo(
    () => resolveFormatter(format, templates[locale]),
    [format, templates, locale],
  );
  const sep = separator ?? t("datePicker.separator");
  const calendarValue = React.useMemo<DateRangeValue | undefined>(
    () =>
      value
        ? {
            from: toZonedCalendarDate(value.from, resolvedTimeZone),
            to: toZonedCalendarDate(value.to, resolvedTimeZone),
          }
        : undefined,
    [resolvedTimeZone, value],
  );
  const activeRange = open ? pendingRange : value;
  const activeCalendarValue = React.useMemo<DateRangeValue | undefined>(
    () =>
      activeRange
        ? {
            from: toZonedCalendarDate(activeRange.from, resolvedTimeZone),
            to: toZonedCalendarDate(activeRange.to, resolvedTimeZone),
          }
        : undefined,
    [activeRange, resolvedTimeZone],
  );

  const defaultShortcuts = React.useMemo(
    () =>
      createDefaultDateRangeShortcuts({
        today: t("datePicker.shortcuts.today"),
        yesterday: t("datePicker.shortcuts.yesterday"),
        last3Days: t("datePicker.shortcuts.last3Days"),
        last7Days: t("datePicker.shortcuts.last7Days"),
        previousWeek: t("datePicker.shortcuts.previousWeek"),
        thisMonth: t("datePicker.shortcuts.thisMonth"),
      }),
    [t],
  );
  const resolvedShortcuts = shortcuts === false ? [] : shortcuts ?? defaultShortcuts;

  const dayPickerValue: DateRange | undefined = activeCalendarValue?.from
    ? { from: activeCalendarValue.from, to: activeCalendarValue.to }
    : undefined;

  React.useEffect(() => {
    if (!open) {
      setPendingRange(value);
    }
  }, [open, value]);

  const emitRange = React.useCallback(
    (range: DateRangeValue | undefined) => {
      onChange?.(range);
      onTimestampChange?.(getTimestampRange(range, resolvedTimeZone));
    },
    [onChange, onTimestampChange, resolvedTimeZone],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setPendingRange(value);
      }
      setOpen(nextOpen);
    },
    [value],
  );

  const commitPendingRange = React.useCallback(() => {
    emitRange(pendingRange);
    setOpen(false);
  }, [emitRange, pendingRange]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setPendingRange(undefined);
      return;
    }

    const getStartDate = (target: Date): Date => {
      if (!isDatetime) {
        return calendarDateToZonedDate(target, resolvedTimeZone, "startOfDay");
      }

      const nextCalendar = activeCalendarValue?.from
        ? applyCalendarTime(target, toCalendarTimeString(activeCalendarValue.from))
        : target;

      return calendarDateToZonedDate(nextCalendar, resolvedTimeZone, "dateTime");
    };

    const getEndDate = (target: Date): Date => {
      if (!isDatetime) {
        return calendarDateToZonedDate(target, resolvedTimeZone, "endOfDay");
      }

      if (activeCalendarValue?.to) {
        return calendarDateToZonedDate(
          applyCalendarTime(target, toCalendarTimeString(activeCalendarValue.to)),
          resolvedTimeZone,
          "dateTime",
        );
      }

      return calendarDateToZonedDate(target, resolvedTimeZone, "endOfDay");
    };

    const isComplete = !!range.to && range.from.getTime() !== range.to.getTime();

    if (!isComplete) {
      setPendingRange({
        from: getStartDate(range.from),
        to: undefined,
      });
      return;
    }

    setPendingRange({
      from: getStartDate(range.from),
      to: getEndDate(range.to as Date),
    });
  };

  const handleTimeZoneChange = React.useCallback(
    (nextTimeZone: string) => {
      const normalized = normalizeDateTimeZone(nextTimeZone);

      if (timeZone === undefined) {
        setInternalTimeZone(normalized);
      }
      onTimeZoneChange?.(normalized);

      if (activeCalendarValue?.from || activeCalendarValue?.to) {
        setPendingRange({
          from: activeCalendarValue.from
            ? calendarDateToZonedDate(
                activeCalendarValue.from,
                normalized,
                "dateTime",
              )
            : undefined,
          to: activeCalendarValue.to
            ? calendarDateToZonedDate(
                activeCalendarValue.to,
                normalized,
                "dateTime",
              )
            : undefined,
        });
      }
    },
    [activeCalendarValue, onTimeZoneChange, timeZone],
  );

  const handleShortcutClick = React.useCallback(
    (shortcut: DateRangeShortcut) => {
      const nextRange = shortcut.getRange({
        timeZone: resolvedTimeZone,
        now: dayjs().tz(resolvedTimeZone),
      });

      emitRange(nextRange);
      setPendingRange(nextRange);
      setOpen(false);
    },
    [emitRange, resolvedTimeZone],
  );

  const display = (() => {
    if (!value?.from && !value?.to) {
      return (
        placeholder ??
        t(isDatetime ? "datePicker.placeholderDateTimeRange" : "datePicker.placeholderRange")
      );
    }
    const start = calendarValue?.from ? formatter(calendarValue.from) : "...";
    const end = calendarValue?.to ? formatter(calendarValue.to) : "...";
    return (
      <span className="inline-flex items-center gap-1.5">
        <span>{start}</span>
        <span className="text-muted-foreground">{sep}</span>
        <span>{end}</span>
      </span>
    );
  })();

  const hasValue = !!(value?.from ?? value?.to);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn(
              isDatetime ? "min-w-80" : "min-w-72",
              "justify-start text-start font-normal",
              !hasValue && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        <span className="min-w-0 flex-1 truncate">{display}</span>
        {showTimeZone && <TimeZoneTag timeZone={resolvedTimeZone} />}
      </PopoverTrigger>
      <PopoverPopup
        align="start"
        className="w-auto p-0"
        viewportClassName="!p-0 [--viewport-inline-padding:0px]"
      >
        {showTimeZone && (
          <div className="border-b px-3 py-2">
            <TimezoneSelect
              value={resolvedTimeZone}
              onValueChange={handleTimeZoneChange}
              options={timeZoneOptions}
              disabled={disabled}
            />
          </div>
        )}
        <div className="flex">
          {resolvedShortcuts.length > 0 && (
            <div className="w-28 shrink-0 border-r p-1.5">
              {resolvedShortcuts.map((shortcut, index) => (
                <button
                  key={index}
                  className="flex min-h-7 w-full items-center rounded-md px-2 text-start text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => handleShortcutClick(shortcut)}
                  type="button"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          )}
          <div>
            <Calendar
              mode="range"
              numberOfMonths={numberOfMonths}
              selected={dayPickerValue}
              onSelect={handleRangeSelect}
            />
            <div className="border-t border-border px-3 pb-4 pt-3">
              {isDatetime && (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <TimeInput
                    label={t("datePicker.startTime")}
                    value={toCalendarTimeString(activeCalendarValue?.from)}
                    disabled={disabled || !activeCalendarValue?.from}
                    onChange={(nextTime) =>
                      setPendingRange({
                        from: activeCalendarValue?.from
                          ? calendarDateToZonedDate(
                              applyCalendarTime(
                                activeCalendarValue.from,
                                nextTime,
                              ),
                              resolvedTimeZone,
                              "dateTime",
                            )
                          : undefined,
                        to: pendingRange?.to,
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground">{sep}</span>
                  <TimeInput
                    label={t("datePicker.endTime")}
                    value={toCalendarTimeString(activeCalendarValue?.to)}
                    disabled={disabled || !activeCalendarValue?.to}
                    onChange={(nextTime) =>
                      setPendingRange({
                        from: pendingRange?.from,
                        to: activeCalendarValue?.to
                          ? calendarDateToZonedDate(
                              applyCalendarTime(activeCalendarValue.to, nextTime),
                              resolvedTimeZone,
                              "dateTime",
                            )
                          : undefined,
                      })
                    }
                  />
                </div>
              )}
              <div className="flex items-center justify-end">
                <Button
                  disabled={disabled || !pendingRange?.from || !pendingRange?.to}
                  onClick={commitPendingRange}
                  size="sm"
                  type="button"
                >
                  {t("actions.confirm")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
