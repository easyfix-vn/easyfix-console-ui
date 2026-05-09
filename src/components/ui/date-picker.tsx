"use client";

import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DATE_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import { useEasyI18n, useEasyT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

export type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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
  placeholder,
  disabled = false,
  className,
  format,
}: DatePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const formatter = React.useMemo(
    () => resolveFormatter(format, DEFAULT_DATE_TEMPLATES[locale]),
    [format, locale],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        {value ? formatter(value) : placeholder ?? t("datePicker.placeholder")}
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-auto">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverPopup>
    </Popover>
  );
}
