"use client";

import { CalendarIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import { useEasyI18n, useEasyT } from "@/i18n";
import { useConfig } from "@/components/ui/config-provider";
import {
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
  normalizeDateTimeZone,
  toCalendarTimeString,
  toZonedCalendarDate,
  type TimeZoneOption,
} from "@/lib/date-time-zone";

/* ------------------------------------------------------------------ */
/* 共享：时间输入框                                                    */
/* ------------------------------------------------------------------ */

type TimeInputProps = {
  label?: React.ReactNode;
  value: string; // HH:mm
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * 用主题色重绘的 time input：
 *  - text-foreground 让数字跟随主题
 *  - dark 下 invert 时钟图标避免黑色图标在暗色背景中看不清
 *  - 容器边框/圆角与 Input 一致
 */
function TimeInput({ label, value, onChange, disabled, className }: TimeInputProps) {
  return (
    <label
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-0 text-sm text-foreground shadow-xs/5 ring-ring/24 transition-shadow focus-within:border-ring focus-within:ring-[3px] sm:h-7",
        disabled && "opacity-64",
        className,
      )}
    >
      <ClockIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      {label && (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {label}
        </span>
      )}
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-foreground tabular-nums outline-none placeholder:text-muted-foreground accent-primary",
          "[&::-webkit-calendar-picker-indicator]:hidden",
          "[color-scheme:light] dark:[color-scheme:dark]",
        )}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* DateTimePicker                                                      */
/* ------------------------------------------------------------------ */

export type DateTimePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  /** 选中日期时间按指定时区转换为时间戳后回调，单位毫秒 */
  onTimestampChange?: (timestamp: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** IANA 时区；未传时读取 ConfigProvider.timeZone 或浏览器时区 */
  timeZone?: string;
  defaultTimeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
  timeZoneOptions?: TimeZoneOption[];
  showTimeZone?: boolean;
  /** 同 DatePicker.format；默认根据 locale 取 YYYY-MM-DD HH:mm 等模板 */
  format?: DateFormatter;
};

export function DateTimePicker({
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
    () => resolveFormatter(format, DEFAULT_DATETIME_TEMPLATES[locale]),
    [format, locale],
  );

  const emitValue = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      onTimestampChange?.(date?.getTime());
    },
    [onChange, onTimestampChange],
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setPendingDate(undefined);
      return;
    }

    const next = applyCalendarTime(
      date,
      activeCalendarValue
        ? toCalendarTimeString(activeCalendarValue)
        : "00:00",
    );
    setPendingDate(calendarDateToZonedDate(next, resolvedTimeZone, "dateTime"));
  };

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
          calendarDateToZonedDate(currentCalendarValue, normalized, "dateTime"),
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
            : placeholder ?? t("datePicker.placeholderDateTime")}
        </span>
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
          onSelect={handleDateSelect}
        />
        <div className="sticky bottom-0 z-1 flex items-center justify-between gap-2 border-t border-border bg-popover px-3 py-2">
          <TimeInput
            className="min-w-0 flex-1"
            label={t("datePicker.startTime")}
            value={toCalendarTimeString(activeCalendarValue)}
            onChange={(nextTime) => {
              const base =
                activeCalendarValue ??
                toZonedCalendarDate(new Date(), resolvedTimeZone) ??
                new Date();
              setPendingDate(
                calendarDateToZonedDate(
                  applyCalendarTime(base, nextTime),
                  resolvedTimeZone,
                  "dateTime",
                ),
              );
            }}
            disabled={disabled || !activeCalendarValue}
          />
          <Button
            className="h-8 sm:h-7"
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
