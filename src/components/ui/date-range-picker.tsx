"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useConfig } from "@/components/ui/config-provider";
import { Button } from "@/components/ui/button";
import {
  DatePickerPanel,
  type DisabledDate,
} from "@/components/ui/date-picker-panel";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import {
  applyTimeValue,
  findFirstAllowedTime,
  isTimeAllowed,
  TimePickerPanel,
  type DisabledTime,
  type SelectableRange,
  type TimeConstraintOptions,
} from "@/components/ui/time-picker-panel";
import { TimezoneSelect, TimeZoneTag } from "@/components/ui/time-zone-select";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEasyI18n, useEasyT } from "@/i18n";
import {
  DEFAULT_DATE_TEMPLATES,
  DEFAULT_DATETIME_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import { cn } from "@/lib/utils";
import {
  calendarDateToZonedDate,
  createDefaultDateRangeShortcuts,
  dayjs,
  getTimestampRange,
  normalizeDateTimeZone,
  toZonedCalendarDate,
  type DateRangeShortcut,
  type TimeZoneOption,
  type TimestampRangeValue,
} from "@/lib/date-time-zone";

export type DateRangeValue = { from?: Date; to?: Date };

export type DateRangePickerProps = {
  /** 是否显示时间选择，开启后可同时选择起止时间 */
  showTime?: boolean;
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue | undefined) => void;
  /** 选中范围按指定时区转换为时间戳后回调，单位毫秒 */
  onTimestampChange?: (range: TimestampRangeValue | undefined) => void;
  placeholder?: string;
  /** 空值时日历初始展示日期，不会作为选中值提交 */
  defaultValue?: Date;
  /** 首次选择起止日期时分别采用的时间 */
  defaultTime?: readonly [string | Date, string | Date];
  disabled?: boolean;
  clearable?: boolean;
  disabledDate?: DisabledDate;
  selectableRange?: SelectableRange;
  disabledTime?: DisabledTime;
  showSeconds?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  startYear?: number;
  endYear?: number;
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
  defaultValue,
  defaultTime = ["00:00:00", "23:59:59"],
  disabled = false,
  clearable = true,
  disabledDate,
  selectableRange,
  disabledTime,
  showSeconds = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  startYear,
  endYear,
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
  const isNarrowLayout = useMediaQuery("max-sm");
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
  const baseTimeConstraints = React.useMemo<TimeConstraintOptions>(
    () => ({
      selectableRange,
      disabledTime,
      showSeconds,
      hourStep,
      minuteStep,
      secondStep,
    }),
    [
      disabledTime,
      hourStep,
      minuteStep,
      secondStep,
      selectableRange,
      showSeconds,
    ],
  );

  React.useEffect(() => {
    if (timeZone === undefined) {
      setInternalTimeZone(
        normalizeDateTimeZone(defaultTimeZone ?? configTimeZone),
      );
    }
  }, [configTimeZone, defaultTimeZone, timeZone]);

  const templates = showTime
    ? DEFAULT_DATETIME_TEMPLATES
    : DEFAULT_DATE_TEMPLATES;
  const formatter = React.useMemo(
    () =>
      resolveFormatter(
        format,
        showTime && showSeconds ? `${templates[locale]}:ss` : templates[locale],
      ),
    [format, locale, showSeconds, showTime, templates],
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
  const dayPickerValue: DateRange | undefined = activeCalendarValue?.from
    ? { from: activeCalendarValue.from, to: activeCalendarValue.to }
    : undefined;
  const calendarToday = toZonedCalendarDate(new Date(), resolvedTimeZone);

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
  const resolvedShortcuts =
    shortcuts === false ? [] : shortcuts ?? defaultShortcuts;

  const emitRange = React.useCallback(
    (range: DateRangeValue | undefined) => {
      onChange?.(range);
      onTimestampChange?.(getTimestampRange(range, resolvedTimeZone));
    },
    [onChange, onTimestampChange, resolvedTimeZone],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setPendingRange(value);
      setOpen(nextOpen);
    },
    [value],
  );

  const toDateWithTime = React.useCallback(
    (
      target: Date,
      role: "start" | "end",
      existing: Date | undefined,
    ): Date => {
      if (!showTime) {
        return calendarDateToZonedDate(
          target,
          resolvedTimeZone,
          role === "start" ? "startOfDay" : "endOfDay",
        );
      }

      let calendarDate = new Date(target);
      if (existing) {
        calendarDate.setHours(
          existing.getHours(),
          existing.getMinutes(),
          existing.getSeconds(),
          0,
        );
      } else {
        calendarDate = applyTimeValue(
          calendarDate,
          role === "start" ? defaultTime[0] : defaultTime[1],
        );
      }
      const constraints = { ...baseTimeConstraints, role } as const;
      const allowed = isTimeAllowed(calendarDate, constraints)
        ? calendarDate
        : findFirstAllowedTime(calendarDate, constraints) ?? calendarDate;
      return calendarDateToZonedDate(
        allowed,
        resolvedTimeZone,
        "dateTime",
      );
    },
    [baseTimeConstraints, defaultTime, resolvedTimeZone, showTime],
  );

  const handleRangeSelect = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from) {
        setPendingRange(undefined);
        return;
      }
      if (disabledDate?.(range.from) || (range.to && disabledDate?.(range.to))) {
        return;
      }

      const from = toDateWithTime(
        range.from,
        "start",
        activeCalendarValue?.from,
      );
      if (!range.to) {
        setPendingRange({ from, to: undefined });
        return;
      }
      setPendingRange({
        from,
        to: toDateWithTime(range.to, "end", activeCalendarValue?.to),
      });
    },
    [activeCalendarValue, disabledDate, toDateWithTime],
  );

  const handleTimeZoneChange = React.useCallback(
    (nextTimeZone: string) => {
      const normalized = normalizeDateTimeZone(nextTimeZone);
      if (timeZone === undefined) setInternalTimeZone(normalized);
      onTimeZoneChange?.(normalized);
      if (activeCalendarValue?.from || activeCalendarValue?.to) {
        setPendingRange({
          from: activeCalendarValue.from
            ? calendarDateToZonedDate(
                activeCalendarValue.from,
                normalized,
                showTime ? "dateTime" : "startOfDay",
              )
            : undefined,
          to: activeCalendarValue.to
            ? calendarDateToZonedDate(
                activeCalendarValue.to,
                normalized,
                showTime ? "dateTime" : "endOfDay",
              )
            : undefined,
        });
      }
    },
    [activeCalendarValue, onTimeZoneChange, showTime, timeZone],
  );

  const isShortcutDisabled = React.useCallback(
    (shortcut: DateRangeShortcut) => {
      const range = shortcut.getRange({
        timeZone: resolvedTimeZone,
        now: dayjs().tz(resolvedTimeZone),
      });
      const from = toZonedCalendarDate(range?.from, resolvedTimeZone);
      const to = toZonedCalendarDate(range?.to, resolvedTimeZone);
      return Boolean(
        !range?.from ||
          !range.to ||
          (from && disabledDate?.(from)) ||
          (to && disabledDate?.(to)),
      );
    },
    [disabledDate, resolvedTimeZone],
  );

  const handleShortcutClick = React.useCallback(
    (shortcut: DateRangeShortcut) => {
      if (isShortcutDisabled(shortcut)) return;
      const nextRange = shortcut.getRange({
        timeZone: resolvedTimeZone,
        now: dayjs().tz(resolvedTimeZone),
      });
      emitRange(nextRange);
      setPendingRange(nextRange);
      setOpen(false);
    },
    [emitRange, isShortcutDisabled, resolvedTimeZone],
  );

  const display = (() => {
    if (!value?.from && !value?.to) {
      return (
        placeholder ??
        t(
          showTime
            ? "datePicker.placeholderDateTimeRange"
            : "datePicker.placeholderRange",
        )
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

  const startTimeValid = !showTime ||
    isTimeAllowed(activeCalendarValue?.from, {
      ...baseTimeConstraints,
      role: "start",
    });
  const endTimeValid = !showTime ||
    isTimeAllowed(activeCalendarValue?.to, {
      ...baseTimeConstraints,
      role: "end",
    });
  const ordered = Boolean(
    pendingRange?.from &&
      pendingRange.to &&
      pendingRange.from.getTime() <= pendingRange.to.getTime(),
  );
  const hasValue = Boolean(value?.from ?? value?.to);
  const startTimePanel = showTime ? (
    <TimePickerPanel
      {...baseTimeConstraints}
      className={isNarrowLayout ? "w-full min-w-0" : "min-w-0 flex-1"}
      disabled={disabled || !activeCalendarValue?.from}
      label={t("datePicker.startTime")}
      onChange={(date) =>
        setPendingRange({
          from: calendarDateToZonedDate(
            date,
            resolvedTimeZone,
            "dateTime",
          ),
          to: pendingRange?.to,
        })
      }
      orientation={isNarrowLayout ? "compact" : "horizontal"}
      role="start"
      value={activeCalendarValue?.from}
    />
  ) : null;
  const endTimePanel = showTime ? (
    <TimePickerPanel
      {...baseTimeConstraints}
      className={isNarrowLayout ? "w-full min-w-0" : "min-w-0 flex-1"}
      disabled={disabled || !activeCalendarValue?.to}
      label={t("datePicker.endTime")}
      onChange={(date) =>
        setPendingRange({
          from: pendingRange?.from,
          to: calendarDateToZonedDate(date, resolvedTimeZone, "dateTime"),
        })
      }
      orientation={isNarrowLayout ? "compact" : "horizontal"}
      role="end"
      value={activeCalendarValue?.to}
    />
  ) : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn(
              showTime ? "w-80 max-w-full" : "w-72 max-w-full",
              "justify-start text-start font-normal",
              !hasValue && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        <span className="min-w-0 flex-1 truncate">{display}</span>
        {clearable && hasValue && !disabled && (
          <span
            aria-label={t("actions.clear")}
            className="-me-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPendingRange(undefined);
              emitRange(undefined);
              setOpen(false);
            }}
            role="button"
            tabIndex={-1}
          >
            <XIcon className="size-4" />
          </span>
        )}
        {showTimeZone && <TimeZoneTag timeZone={resolvedTimeZone} />}
      </PopoverTrigger>
      <PopoverPopup
        align="start"
        className={cn(
          "max-w-[calc(100vw-1rem)] p-0",
          isNarrowLayout ? "w-[14.25rem]" : "w-auto",
        )}
        viewportClassName="!p-0 [--viewport-inline-padding:0px]"
      >
        {showTimeZone && (
          <div
            className={cn(
              "flex justify-center border-b py-2",
              isNarrowLayout ? "px-2" : "px-3",
            )}
          >
            <TimezoneSelect
              className={
                isNarrowLayout ? "w-full min-w-0" : "w-60 max-w-full"
              }
              value={resolvedTimeZone}
              onValueChange={handleTimeZoneChange}
              options={timeZoneOptions}
              disabled={disabled}
            />
          </div>
        )}
        <div
          className={cn("flex", isNarrowLayout && "flex-col")}
          data-slot="date-range-picker-layout"
        >
          {resolvedShortcuts.length > 0 && (
            <div
              className={cn(
                "shrink-0 p-1.5",
                isNarrowLayout
                  ? "flex w-full gap-1 overflow-x-auto border-b"
                  : "w-28 border-r",
              )}
              data-slot="date-range-picker-shortcuts"
            >
              {resolvedShortcuts.map((shortcut, index) => {
                const shortcutDisabled = isShortcutDisabled(shortcut);
                const shortcutButton = (
                  <button
                    className={cn(
                      "flex min-h-7 min-w-0 items-center rounded-md px-2 text-start text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
                      isNarrowLayout
                        ? "w-auto shrink-0 whitespace-nowrap"
                        : "w-full overflow-hidden whitespace-nowrap",
                    )}
                    data-slot="date-range-picker-shortcut"
                    disabled={shortcutDisabled}
                    onClick={() => handleShortcutClick(shortcut)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "min-w-0",
                        isNarrowLayout
                          ? "whitespace-nowrap"
                          : "block flex-1 truncate",
                      )}
                    >
                      {shortcut.label}
                    </span>
                  </button>
                );

                if (isNarrowLayout) {
                  return (
                    <React.Fragment key={index}>
                      {shortcutButton}
                    </React.Fragment>
                  );
                }

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger render={shortcutButton} />
                    <TooltipPopup align="center" side="right">
                      <span className="block max-w-64 whitespace-normal break-words">
                        {shortcut.label}
                      </span>
                    </TooltipPopup>
                  </Tooltip>
                );
              })}
            </div>
          )}
          <div
            className={cn(
              "min-w-0 max-w-full overflow-x-hidden",
              isNarrowLayout && "w-full",
            )}
            data-slot="date-range-picker-calendar"
          >
            <DatePickerPanel
              className="mx-auto"
              calendarClassNames={{
                month: "min-w-0",
                months: "flex-col gap-4 sm:flex-row",
                weekday: "text-[11px]",
              }}
              calendarStyle={
                { "--cell-size": "1.875rem" } as React.CSSProperties
              }
              defaultMonth={
                activeCalendarValue?.from ??
                toZonedCalendarDate(defaultValue, resolvedTimeZone) ??
                calendarToday
              }
              disabledDate={disabledDate}
              endYear={endYear}
              mode="range"
              numberOfMonths={numberOfMonths}
              onRangeSelect={handleRangeSelect}
              selectedRange={dayPickerValue}
              startYear={startYear}
              today={calendarToday}
            />
          </div>
        </div>
        <div
          className={cn(
            "flex flex-wrap gap-2 border-t border-border px-3 py-2",
            showTime && isNarrowLayout
              ? "flex-nowrap flex-col items-stretch"
              : "items-center",
            !showTime && "justify-end",
          )}
          data-slot="date-range-picker-footer"
        >
          {showTime && isNarrowLayout ? (
            <div
              className="grid w-full min-w-0 grid-cols-2 gap-2"
              data-slot="date-range-picker-time-grid"
            >
              {startTimePanel}
              {endTimePanel}
            </div>
          ) : showTime ? (
            <>
              {startTimePanel}
              <span
                className="shrink-0 text-xs text-muted-foreground"
                data-slot="date-range-picker-time-separator"
              >
                {sep}
              </span>
              {endTimePanel}
            </>
          ) : null}
          <Button
            className={cn(
              showTime && isNarrowLayout ? "h-9 w-full" : "h-8 sm:h-7",
              showTime && !isNarrowLayout && "ms-auto",
            )}
            disabled={
              disabled ||
              !pendingRange?.from ||
              !pendingRange.to ||
              !ordered ||
              !startTimeValid ||
              !endTimeValid
            }
            onClick={() => {
              emitRange(pendingRange);
              setOpen(false);
            }}
            size="sm"
            type="button"
          >
            {t("actions.confirm")}
          </Button>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
