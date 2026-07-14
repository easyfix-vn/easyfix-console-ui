"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DATE_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import { useEasyI18n, useEasyT } from "@/i18n";
import { useConfig } from "@/components/ui/config-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { TimezoneSelect, TimeZoneTag } from "@/components/ui/time-zone-select";
import {
  calendarDateToZonedDate,
  normalizeDateTimeZone,
  toZonedCalendarDate,
  type TimeZoneOption,
} from "@/lib/date-time-zone";

export type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  /** 选中日期按指定时区转换为时间戳后回调，单位毫秒 */
  onTimestampChange?: (timestamp: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  /** IANA 时区；未传时读取 ConfigProvider.timeZone 或浏览器时区 */
  timeZone?: string;
  defaultTimeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
  timeZoneOptions?: TimeZoneOption[];
  showTimeZone?: boolean;
  /**
   * 格式化模板：可传字符串模板（推荐，与 dayjs 类似）或自定义函数。
   * 字符串模板支持：YYYY/YY/MM/M/DD/D/HH/H/mm/m/ss/s。
   * 默认根据 ConfigProvider 的 locale 选择（zh: YYYY-MM-DD，en: MM/DD/YYYY，vi: DD/MM/YYYY）。
   */
  format?: DateFormatter;
};

export function DatePicker({
  value,
  onChange,
  onTimestampChange,
  placeholder,
  disabled = false,
  clearable = true,
  className,
  timeZone,
  defaultTimeZone,
  onTimeZoneChange,
  timeZoneOptions,
  showTimeZone = true,
  format,
}: DatePickerProps): React.ReactElement {
  const { timeZone: configTimeZone } = useConfig();
  const [open, setOpen] = React.useState(false);
  const [pendingDate, setPendingDate] = React.useState<Date | undefined>(value);
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
    () => resolveFormatter(format, DEFAULT_DATE_TEMPLATES[locale]),
    [format, locale],
  );

  const emitValue = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      onTimestampChange?.(date?.getTime());
    },
    [onChange, onTimestampChange],
  );

  const handleTimeZoneChange = React.useCallback(
    (nextTimeZone: string) => {
      const normalized = normalizeDateTimeZone(nextTimeZone);
      const currentCalendarValue = toZonedCalendarDate(
        open ? pendingDate : value,
        resolvedTimeZone,
      );

      if (timeZone === undefined) {
        setInternalTimeZone(normalized);
      }
      onTimeZoneChange?.(normalized);

      if (currentCalendarValue) {
        setPendingDate(
          calendarDateToZonedDate(
            currentCalendarValue,
            normalized,
            "startOfDay",
          ),
        );
      }
    },
    [onTimeZoneChange, open, pendingDate, resolvedTimeZone, timeZone, value],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setPendingDate(value);
      }
      setOpen(nextOpen);
    },
    [value],
  );

  const commitPendingDate = React.useCallback(() => {
    if (!pendingDate) return;
    emitValue(pendingDate);
    setOpen(false);
  }, [emitValue, pendingDate]);
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

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn(
              "w-56 justify-start text-start font-normal",
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
            : placeholder ?? t("datePicker.placeholder")}
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
          <div className="border-b px-3 py-2">
            <TimezoneSelect
              value={resolvedTimeZone}
              onValueChange={handleTimeZoneChange}
              options={timeZoneOptions}
              disabled={disabled}
            />
          </div>
        )}
        <Calendar
          className="w-full max-w-full"
          defaultMonth={activeCalendarValue ?? calendarToday}
          mode="single"
          selected={activeCalendarValue}
          today={calendarToday}
          onSelect={(date) => {
            setPendingDate(
              date
                ? calendarDateToZonedDate(date, resolvedTimeZone, "startOfDay")
                : undefined,
            );
          }}
        />
        <div className="sticky bottom-0 z-1 flex items-center justify-end border-t border-border bg-popover px-3 py-2">
          <Button
            disabled={disabled || !pendingDate}
            onClick={commitPendingDate}
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
