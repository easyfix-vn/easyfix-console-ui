"use client";

import { CalendarIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useEasyI18n, useEasyT } from "@/i18n";
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

function toTimeString(date: Date | undefined): string {
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function applyTime(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const next = new Date(base);
  next.setHours(h || 0, m || 0, 0, 0);
  return next;
}

/* ------------------------------------------------------------------ */
/* DateRangePicker                                                      */
/* ------------------------------------------------------------------ */

export type DateRangePickerProps = {
  /** 是否显示时间输入，开启后可同时选择起止时间 */
  showTime?: boolean;
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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
  placeholder,
  disabled = false,
  className,
  format,
  separator,
  numberOfMonths = 2,
}: DateRangePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const { locale } = useEasyI18n();
  const t = useEasyT();

  const isDatetime = showTime;
  const templates = isDatetime ? DEFAULT_DATETIME_TEMPLATES : DEFAULT_DATE_TEMPLATES;

  const formatter = React.useMemo(
    () => resolveFormatter(format, templates[locale]),
    [format, templates, locale],
  );
  const sep = separator ?? t("datePicker.separator");

  const dayPickerValue: DateRange | undefined = value?.from
    ? { from: value.from, to: value.to }
    : undefined;

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onChange?.(undefined);
      return;
    }

    const applyExistingTime = (target: Date, source?: Date) =>
      isDatetime && source ? applyTime(target, toTimeString(source)) : target;

    const isComplete =
      !!range.to && range.from.getTime() !== range.to.getTime();

    if (!isComplete) {
      onChange?.({
        from: applyExistingTime(range.from, value?.from),
        to: undefined,
      });
      return;
    }

    onChange?.({
      from: applyExistingTime(range.from, value?.from),
      to: applyExistingTime(range.to as Date, value?.to),
    });
    if (!isDatetime) setOpen(false);
  };

  const display = (() => {
    if (!value?.from && !value?.to) {
      return (
        placeholder ??
        t(isDatetime ? "datePicker.placeholderDateTimeRange" : "datePicker.placeholderRange")
      );
    }
    const start = value?.from ? formatter(value.from) : "...";
    const end = value?.to ? formatter(value.to) : "...";
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
    <Popover open={open} onOpenChange={setOpen}>
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
        {display}
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-auto">
        <Calendar
          mode="range"
          numberOfMonths={numberOfMonths}
          selected={dayPickerValue}
          onSelect={handleRangeSelect}
        />
        {isDatetime && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 pb-3 pt-2">
            <TimeInput
              label={t("datePicker.startTime")}
              value={toTimeString(value?.from)}
              disabled={disabled || !value?.from}
              onChange={(v) =>
                onChange?.({
                  from: value?.from ? applyTime(value.from, v) : undefined,
                  to: value?.to,
                })
              }
            />
            <span className="text-xs text-muted-foreground">{sep}</span>
            <TimeInput
              label={t("datePicker.endTime")}
              value={toTimeString(value?.to)}
              disabled={disabled || !value?.to}
              onChange={(v) =>
                onChange?.({
                  from: value?.from,
                  to: value?.to ? applyTime(value.to, v) : undefined,
                })
              }
            />
          </div>
        )}
      </PopoverPopup>
    </Popover>
  );
}
