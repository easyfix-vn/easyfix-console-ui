"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  formatRanges,
  isValidOpeningRange,
  OpeningHoursRangesEditor,
  type OpeningHoursRange,
} from "@/components/EasyOpeningHours";

export type HolidayScheduleItem = {
  date: string;
  end_date?: string;
  name: string;
  closed: boolean;
  ranges?: OpeningHoursRange[];
};
export interface HolidayScheduleValue {
  version: 1;
  items: HolidayScheduleItem[];
}
export type HolidayScheduleValidationError = {
  index: number;
  field: "date" | "end_date" | "ranges";
};

export function validateHolidaySchedule(value: HolidayScheduleValue): HolidayScheduleValidationError[] {
  const errors: HolidayScheduleValidationError[] = [];
  value.items.forEach((item, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) errors.push({ index, field: "date" });
    if (item.end_date && item.date && item.end_date < item.date) errors.push({ index, field: "end_date" });
    if (!item.closed && (!item.ranges?.length || item.ranges.some((range) => !isValidOpeningRange(range)))) {
      errors.push({ index, field: "ranges" });
    }
  });
  return errors;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDate(date?: Date): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface EasyHolidayScheduleEditorProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  value: HolidayScheduleValue;
  onChange: (value: HolidayScheduleValue) => void;
  disabled?: boolean;
}

export function EasyHolidayScheduleEditor({
  value,
  onChange,
  disabled = false,
  className,
  ...props
}: EasyHolidayScheduleEditorProps): React.ReactElement {
  const t = useEasyT();
  const errors = React.useMemo(() => validateHolidaySchedule(value), [value]);

  function updateItem(index: number, patch: Partial<HolidayScheduleItem>): void {
    onChange({ ...value, items: value.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) });
  }

  function removeItem(index: number): void {
    onChange({ ...value, items: value.items.filter((_, itemIndex) => itemIndex !== index) });
  }

  function hasError(index: number, field: HolidayScheduleValidationError["field"]): boolean {
    return errors.some((error) => error.index === index && error.field === field);
  }

  return (
    <div {...props} className={cn("space-y-3", className)} data-slot="easy-holiday-schedule-editor">
      {value.items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg bg-muted/28 p-3">
          <div className="grid gap-2 md:grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(8rem,1fr)_auto_auto] md:items-center">
            <DatePicker value={parseDate(item.date)} onChange={(date) => updateItem(index, { date: formatDate(date) })} placeholder={t("holidaySchedule.date")} disabled={disabled} showTimeZone={false} className={cn("w-full", hasError(index, "date") && "border-destructive/64")} />
            <DatePicker value={parseDate(item.end_date)} onChange={(date) => updateItem(index, { end_date: formatDate(date) || undefined })} placeholder={t("holidaySchedule.endDate")} disabled={disabled} showTimeZone={false} className={cn("w-full", hasError(index, "end_date") && "border-destructive/64")} />
            <Input value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} placeholder={t("holidaySchedule.name")} disabled={disabled} />
            <label className="inline-flex items-center gap-2 text-sm">
              <Switch checked={item.closed} disabled={disabled} onCheckedChange={(closed) => updateItem(index, { closed })} />
              {t("holidaySchedule.closed")}
            </label>
            <Button disabled={disabled} onClick={() => removeItem(index)} size="sm" type="button" variant="ghost">
              <Trash2Icon className="size-4" />
            </Button>
          </div>
          {!item.closed && (
            <OpeningHoursRangesEditor
              disabled={disabled}
              ranges={item.ranges?.length ? item.ranges : [{ open: "09:00", close: "18:00" }]}
              errors={hasError(index, "ranges") ? [0] : []}
              onChange={(ranges) => updateItem(index, { ranges })}
            />
          )}
        </div>
      ))}
      {errors.length > 0 && <p className="text-xs text-destructive">{t("holidaySchedule.invalid")}</p>}
      <Button disabled={disabled} onClick={() => onChange({ ...value, items: [...value.items, { date: "", name: "", closed: true }] })} type="button" variant="outline">
        <PlusIcon className="size-4" />
        {t("holidaySchedule.addItem")}
      </Button>
    </div>
  );
}

export interface EasyHolidayScheduleViewProps extends React.ComponentPropsWithoutRef<"div"> {
  value: HolidayScheduleValue;
}

export function EasyHolidayScheduleView({ value, className, ...props }: EasyHolidayScheduleViewProps): React.ReactElement {
  const t = useEasyT();
  const items = [...value.items].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div {...props} className={cn("divide-y rounded-lg border", className)} data-slot="easy-holiday-schedule-view">
      {items.map((item, index) => (
        <div key={`${item.date}-${index}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
          <span className="font-medium">{item.end_date ? `${item.date} ${t("datePicker.separator")} ${item.end_date}` : item.date}</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
          {item.closed ? <Badge variant="warning">{t("holidaySchedule.closed")}</Badge> : <span>{formatRanges(item.ranges ?? [])}</span>}
        </div>
      ))}
    </div>
  );
}
