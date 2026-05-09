"use client";

import { CalendarIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import { useEasyI18n, useEasyT } from "@/i18n";
import {
  DEFAULT_DATETIME_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

/* ------------------------------------------------------------------ */
/* 共享：时间输入框                                                    */
/* ------------------------------------------------------------------ */

type TimeInputProps = {
  label?: React.ReactNode;
  value: string; // HH:mm
  onChange: (val: string) => void;
  disabled?: boolean;
};

/**
 * 用主题色重绘的 time input：
 *  - text-foreground 让数字跟随主题
 *  - dark 下 invert 时钟图标避免黑色图标在暗色背景中看不清
 *  - 容器边框/圆角与 Input 一致
 */
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
/* DateTimePicker                                                      */
/* ------------------------------------------------------------------ */

export type DateTimePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 同 DatePicker.format；默认根据 locale 取 YYYY-MM-DD HH:mm 等模板 */
  format?: DateFormatter;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  format,
}: DateTimePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const formatter = React.useMemo(
    () => resolveFormatter(format, DEFAULT_DATETIME_TEMPLATES[locale]),
    [format, locale],
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return onChange?.(undefined);
    const next = new Date(date);
    if (value) next.setHours(value.getHours(), value.getMinutes());
    onChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        {value
          ? formatter(value)
          : placeholder ?? t("datePicker.placeholderDateTime")}
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-auto">
        <Calendar mode="single" selected={value} onSelect={handleDateSelect} />
        <div className="flex items-center justify-end gap-2 border-t border-border px-3 pb-3 pt-2">
          <TimeInput
            label={t("datePicker.startTime")}
            value={toTimeString(value)}
            onChange={(v) => onChange?.(applyTime(value ?? new Date(), v))}
            disabled={disabled || !value}
          />
        </div>
      </PopoverPopup>
    </Popover>
  );
}
