"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useConfig } from "@/components/ui/config-provider";
import { Button } from "@/components/ui/button";
import {
  DatePickerPanel,
  type DatePickerType,
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
import { useEasyI18n, useEasyT } from "@/i18n";
import {
  DEFAULT_DATETIME_TEMPLATES,
  DEFAULT_MONTH_TEMPLATES,
  DEFAULT_YEAR_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import { cn } from "@/lib/utils";
import {
  calendarDateToZonedDate,
  normalizeDateTimeZone,
  toZonedCalendarDate,
  type TimeZoneOption,
} from "@/lib/date-time-zone";

export type DateTimePickerType = "datetime" | "date" | "month" | "year";

export type DateTimePickerProps = {
  /**
   * 选择粒度；year/month 分别返回当年/当月第一天，且不显示时间面板。
   * `date` 仅作为旧用法的兼容别名，等同于 `datetime`。
   */
  type?: DateTimePickerType;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  /** 选中日期时间按指定时区转换为时间戳后回调，单位毫秒 */
  onTimestampChange?: (timestamp: number | undefined) => void;
  placeholder?: string;
  /** 空值时日历初始展示日期，不会直接提交 */
  defaultValue?: Date;
  /** 空值首次选择日期时采用的时间 */
  defaultTime?: string | Date;
  disabled?: boolean;
  clearable?: boolean;
  /** 返回 true 时不可选择；month/year 分别以月 1 日/当年 1 月 1 日判断 */
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
  /** 同 DatePicker.format；默认根据 type 和 locale 选择日期模板 */
  format?: DateFormatter;
};

export function DateTimePicker({
  type = "datetime",
  value,
  onChange,
  onTimestampChange,
  placeholder,
  defaultValue,
  defaultTime = "00:00:00",
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
  format,
}: DateTimePickerProps): React.ReactElement {
  const { timeZone: configTimeZone } = useConfig();
  const [open, setOpen] = React.useState(false);
  const [pendingDate, setPendingDate] = React.useState<Date | undefined>(value);
  const [internalTimeZone, setInternalTimeZone] = React.useState(() =>
    normalizeDateTimeZone(defaultTimeZone ?? configTimeZone),
  );
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const resolvedTimeZone = normalizeDateTimeZone(timeZone ?? internalTimeZone);
  const isDateTime = type === "datetime" || type === "date";
  const pickerType: DatePickerType = isDateTime ? "date" : type;
  const constraints = React.useMemo<TimeConstraintOptions>(
    () => ({
      selectableRange,
      disabledTime,
      role: "single",
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

  const calendarValue = React.useMemo(
    () => toZonedCalendarDate(value, resolvedTimeZone),
    [value, resolvedTimeZone],
  );
  const activeDate = open ? pendingDate : value;
  const activeCalendarValue = React.useMemo(
    () => toZonedCalendarDate(activeDate, resolvedTimeZone),
    [activeDate, resolvedTimeZone],
  );
  const calendarToday = toZonedCalendarDate(new Date(), resolvedTimeZone);
  const formatter = React.useMemo(
    () => {
      const template =
        type === "year"
          ? DEFAULT_YEAR_TEMPLATES[locale]
          : type === "month"
            ? DEFAULT_MONTH_TEMPLATES[locale]
            : showSeconds
              ? `${DEFAULT_DATETIME_TEMPLATES[locale]}:ss`
              : DEFAULT_DATETIME_TEMPLATES[locale];
      return resolveFormatter(format, template);
    },
    [format, locale, showSeconds, type],
  );

  const emitValue = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      onTimestampChange?.(date?.getTime());
    },
    [onChange, onTimestampChange],
  );

  const handleDateSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date || disabledDate?.(date)) {
        setPendingDate(undefined);
        return;
      }

      if (!isDateTime) {
        const next = calendarDateToZonedDate(
          date,
          resolvedTimeZone,
          "startOfDay",
        );
        setPendingDate(next);
        emitValue(next);
        setOpen(false);
        return;
      }

      let next = new Date(date);
      if (activeCalendarValue) {
        next.setHours(
          activeCalendarValue.getHours(),
          activeCalendarValue.getMinutes(),
          activeCalendarValue.getSeconds(),
          0,
        );
      } else {
        next = applyTimeValue(next, defaultTime);
      }
      const allowed = isTimeAllowed(next, constraints)
        ? next
        : findFirstAllowedTime(next, constraints) ?? next;
      setPendingDate(
        calendarDateToZonedDate(allowed, resolvedTimeZone, "dateTime"),
      );
    },
    [
      activeCalendarValue,
      constraints,
      defaultTime,
      disabledDate,
      emitValue,
      isDateTime,
      resolvedTimeZone,
    ],
  );

  const handleTimeZoneChange = React.useCallback(
    (nextTimeZone: string) => {
      const normalized = normalizeDateTimeZone(nextTimeZone);
      const currentCalendarValue = toZonedCalendarDate(
        open ? pendingDate : value,
        resolvedTimeZone,
      );

      if (timeZone === undefined) setInternalTimeZone(normalized);
      onTimeZoneChange?.(normalized);
      if (currentCalendarValue) {
        setPendingDate(
          calendarDateToZonedDate(
            currentCalendarValue,
            normalized,
            isDateTime ? "dateTime" : "startOfDay",
          ),
        );
      }
    },
    [
      isDateTime,
      onTimeZoneChange,
      open,
      pendingDate,
      resolvedTimeZone,
      timeZone,
      value,
    ],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setPendingDate(value);
      setOpen(nextOpen);
    },
    [value],
  );

  const handleClear = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setPendingDate(undefined);
      emitValue(undefined);
      setOpen(false);
    },
    [emitValue],
  );

  const validTime = isTimeAllowed(activeCalendarValue, constraints);
  const validDate = Boolean(
    activeCalendarValue && !disabledDate?.(activeCalendarValue),
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn(
              "w-64 justify-start text-start font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        <span className="min-w-0 flex-1 truncate">
          {calendarValue
            ? formatter(calendarValue)
            : placeholder ??
              t(
                type === "year"
                  ? "datePicker.placeholderYear"
                  : type === "month"
                    ? "datePicker.placeholderMonth"
                    : "datePicker.placeholderDateTime",
              )}
        </span>
        {clearable && value && !disabled && (
          <span
            aria-label={t("actions.clear")}
            className="-me-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={handleClear}
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
        className="w-auto max-w-[calc(100vw-1rem)]"
        viewportClassName="!p-0 [--viewport-inline-padding:0px]"
      >
        {showTimeZone && (
          <div className="flex justify-center border-b px-3 py-2">
            <TimezoneSelect
              className="w-60 max-w-full"
              value={resolvedTimeZone}
              onValueChange={handleTimeZoneChange}
              options={timeZoneOptions}
              disabled={disabled}
            />
          </div>
        )}
        <DatePickerPanel
          className="mx-auto"
          key={`${pickerType}-${open ? "open" : "closed"}`}
          defaultMonth={
            activeCalendarValue ??
            toZonedCalendarDate(defaultValue, resolvedTimeZone) ??
            calendarToday
          }
          disabledDate={disabledDate}
          endYear={endYear}
          onDateSelect={handleDateSelect}
          selectedDate={activeCalendarValue}
          startYear={startYear}
          today={calendarToday}
          type={pickerType}
        />
        {isDateTime && (
          <div className="sticky bottom-0 z-1 flex flex-col items-stretch gap-2 border-t border-border bg-popover px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <TimePickerPanel
              {...constraints}
              className="min-w-0 flex-1 max-sm:justify-center"
              disabled={disabled || !activeCalendarValue}
              onChange={(date) =>
                setPendingDate(
                  calendarDateToZonedDate(
                    date,
                    resolvedTimeZone,
                    "dateTime",
                  ),
                )
              }
              value={activeCalendarValue}
            />
            <Button
              className="h-8 self-end sm:h-7"
              disabled={
                disabled || !pendingDate || !validDate || !validTime
              }
              onClick={() => {
                emitValue(pendingDate);
                setOpen(false);
              }}
              size="sm"
              type="button"
            >
              {t("actions.confirm")}
            </Button>
          </div>
        )}
      </PopoverPopup>
    </Popover>
  );
}
