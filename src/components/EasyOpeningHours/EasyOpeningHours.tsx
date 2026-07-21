"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";

export type OpeningHoursRange = { open: string; close: string };
export type OpeningHoursRule = { days: number[]; ranges: OpeningHoursRange[] };
export interface OpeningHoursValue {
  version: 1;
  weekly: OpeningHoursRule[];
}

export interface OpeningHoursValidationResult {
  valid: boolean;
  dayConflicts: number[];
  rangeErrors: { ruleIndex: number; rangeIndex: number }[];
}

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const DEFAULT_RANGE: OpeningHoursRange = { open: "09:00", close: "18:00" };

export function isValidTimeText(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidOpeningRange(range: OpeningHoursRange): boolean {
  return isValidTimeText(range.open) && isValidTimeText(range.close) && range.open < range.close;
}

export function validateOpeningHours(value: OpeningHoursValue): OpeningHoursValidationResult {
  const seen = new Map<number, number>();
  const conflicts = new Set<number>();
  const rangeErrors: { ruleIndex: number; rangeIndex: number }[] = [];

  value.weekly.forEach((rule, ruleIndex) => {
    rule.days.forEach((day) => {
      if (day < 1 || day > 7) conflicts.add(day);
      if (seen.has(day)) conflicts.add(day);
      seen.set(day, ruleIndex);
    });
    rule.ranges.forEach((range, rangeIndex) => {
      if (!isValidOpeningRange(range)) rangeErrors.push({ ruleIndex, rangeIndex });
    });
  });

  return {
    valid: conflicts.size === 0 && rangeErrors.length === 0,
    dayConflicts: [...conflicts].sort((a, b) => a - b),
    rangeErrors,
  };
}

function useWeekdayLabels(): string[] {
  const t = useEasyT();
  return DAYS.map((day) => t(`openingHours.weekdays.${day}`));
}

export interface EasyOpeningHoursEditorProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  value: OpeningHoursValue;
  onChange: (value: OpeningHoursValue) => void;
  disabled?: boolean;
}

export function EasyOpeningHoursEditor({
  value,
  onChange,
  disabled = false,
  className,
  ...props
}: EasyOpeningHoursEditorProps): React.ReactElement {
  const t = useEasyT();
  const weekdays = useWeekdayLabels();
  const validation = React.useMemo(() => validateOpeningHours(value), [value]);

  function updateRule(ruleIndex: number, nextRule: OpeningHoursRule): void {
    onChange({ ...value, weekly: value.weekly.map((rule, index) => (index === ruleIndex ? nextRule : rule)) });
  }

  function removeRule(ruleIndex: number): void {
    onChange({ ...value, weekly: value.weekly.filter((_, index) => index !== ruleIndex) });
  }

  function addRule(): void {
    onChange({ ...value, weekly: [...value.weekly, { days: [], ranges: [{ ...DEFAULT_RANGE }] }] });
  }

  return (
    <div {...props} className={cn("space-y-3", className)} data-slot="easy-opening-hours-editor">
      {value.weekly.map((rule, ruleIndex) => (
        <div key={ruleIndex} className="space-y-2 rounded-lg bg-muted/28 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {DAYS.map((day, dayIndex) => {
              const selected = rule.days.includes(day);
              const conflict = validation.dayConflicts.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  className={cn(
                    "h-7 rounded-md px-2 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                    selected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background text-muted-foreground",
                    selected && conflict && "bg-destructive text-white hover:bg-destructive/90",
                  )}
                  onClick={() => {
                    const days = selected
                      ? rule.days.filter((item) => item !== day)
                      : [...rule.days, day].sort((a, b) => a - b);
                    updateRule(ruleIndex, { ...rule, days });
                  }}
                >
                  {weekdays[dayIndex]}
                </button>
              );
            })}
            <Button className="ms-auto" disabled={disabled} onClick={() => removeRule(ruleIndex)} size="sm" type="button" variant="ghost">
              <Trash2Icon className="size-4" />
              {t("actions.delete")}
            </Button>
          </div>
          <OpeningHoursRangesEditor
            disabled={disabled}
            ranges={rule.ranges}
            errors={validation.rangeErrors.filter((error) => error.ruleIndex === ruleIndex).map((error) => error.rangeIndex)}
            onChange={(ranges) => updateRule(ruleIndex, { ...rule, ranges })}
          />
        </div>
      ))}
      {!validation.valid && (
        <p className="text-xs text-destructive">
          {validation.dayConflicts.length ? t("openingHours.conflict") : t("openingHours.invalidRange")}
        </p>
      )}
      <Button disabled={disabled} onClick={addRule} type="button" variant="outline">
        <PlusIcon className="size-4" />
        {t("openingHours.addRule")}
      </Button>
    </div>
  );
}

export interface OpeningHoursRangesEditorProps {
  ranges: OpeningHoursRange[];
  onChange: (ranges: OpeningHoursRange[]) => void;
  disabled?: boolean;
  errors?: number[];
}

export function OpeningHoursRangesEditor({
  ranges,
  onChange,
  disabled = false,
  errors = [],
}: OpeningHoursRangesEditorProps): React.ReactElement {
  const t = useEasyT();

  function updateRange(index: number, patch: Partial<OpeningHoursRange>): void {
    onChange(ranges.map((range, rangeIndex) => (rangeIndex === index ? { ...range, ...patch } : range)));
  }

  return (
    <div className="space-y-2" data-slot="opening-hours-ranges-editor">
      {ranges.map((range, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <TimeSelect ariaLabel={t("openingHours.open")} disabled={disabled} end="23:30" onChange={(open) => updateRange(index, { open: open ?? "" })} start="00:00" step="00:30" value={range.open || null} />
          <span className="text-xs text-muted-foreground">{t("datePicker.separator")}</span>
          <TimeSelect ariaLabel={t("openingHours.close")} disabled={disabled} end="24:00" minTime={range.open} onChange={(close) => updateRange(index, { close: close ?? "" })} start="00:30" step="00:30" value={range.close || null} />
          <Button disabled={disabled || ranges.length <= 1} onClick={() => onChange(ranges.filter((_, rangeIndex) => rangeIndex !== index))} size="sm" type="button" variant="ghost">
            <Trash2Icon className="size-4" />
          </Button>
          {errors.includes(index) && <span className="text-xs text-destructive">{t("openingHours.invalidRange")}</span>}
        </div>
      ))}
      <Button disabled={disabled || ranges.length >= 3} onClick={() => onChange([...ranges, { ...DEFAULT_RANGE }])} size="sm" type="button" variant="ghost">
        <PlusIcon className="size-4" />
        {t("openingHours.addRange")}
      </Button>
    </div>
  );
}

export interface EasyOpeningHoursViewProps extends React.ComponentPropsWithoutRef<"div"> {
  value: OpeningHoursValue;
}

export function EasyOpeningHoursView({ value, className, ...props }: EasyOpeningHoursViewProps): React.ReactElement {
  const t = useEasyT();
  const weekdays = useWeekdayLabels();
  const dayRanges = new Map<number, OpeningHoursRange[]>();
  value.weekly.forEach((rule) => rule.days.forEach((day) => dayRanges.set(day, rule.ranges)));

  return (
    <div {...props} className={cn("divide-y rounded-lg border", className)} data-slot="easy-opening-hours-view">
      {DAYS.map((day, index) => {
        const ranges = dayRanges.get(day) ?? [];
        return (
          <div key={day} className="flex min-h-10 items-center gap-3 px-3 py-2 text-sm">
            <span className="w-16 shrink-0 font-medium">{weekdays[index]}</span>
            {ranges.length ? (
              <span className="text-foreground">{formatRanges(ranges)}</span>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">{t("openingHours.closed")}</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function formatRanges(ranges: OpeningHoursRange[]): string {
  return ranges.map((range) => `${range.open}-${range.close}`).join(" / ");
}
