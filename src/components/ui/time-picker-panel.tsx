"use client";

import { ClockIcon } from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";

export type TimePickerRole = "single" | "start" | "end";
export type SelectableRange = string | string[];

export type DisabledTimeConfig = {
  disabledHours?: number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
};

export type DisabledTime = (
  date: Date,
  role: TimePickerRole,
) => DisabledTimeConfig;

export type TimeConstraintOptions = {
  selectableRange?: SelectableRange;
  disabledTime?: DisabledTime;
  role?: TimePickerRole;
  showSeconds?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
};

export type TimePickerPanelProps = TimeConstraintOptions & {
  value?: Date;
  onChange?: (date: Date) => void;
  onValidityChange?: (valid: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: React.ReactNode;
  /** 时间标签与输入框的排列方式；compact 用于窄屏双列布局中的单列 */
  orientation?: "horizontal" | "compact";
};

type ParsedRange = readonly [start: number, end: number];
type TimeUnit = "hour" | "minute" | "second";
type FixedTime = Partial<Record<TimeUnit, number>>;

type TimeUnitSelectProps = {
  label: string;
  value: number;
  values: number[];
  disabled: boolean;
  compact?: boolean;
  dense?: boolean;
  isOptionDisabled: (value: number) => boolean;
  onChange: (value: number) => void;
};

function TimeUnitSelect({
  label,
  value,
  values,
  disabled,
  compact = false,
  dense = false,
  isOptionDisabled,
  onChange,
}: TimeUnitSelectProps): React.ReactElement {
  const pad = (item: number) => String(item).padStart(2, "0");

  return (
    <Select<number>
      clearable={false}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onChange(nextValue);
      }}
      value={value}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "min-w-0 tabular-nums",
          dense
            ? "h-7 min-h-7 w-7 gap-0 px-0.5 text-xs [&_[data-slot=select-icon]]:hidden"
            : compact
              ? "h-7 min-h-7 w-10 gap-0.5 px-0.5 text-sm [&_[data-slot=select-icon]_svg]:me-0 [&_[data-slot=select-icon]_svg]:size-3"
              : "w-14 gap-1 px-1.5",
        )}
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectPopup className="max-h-52 min-w-14">
        {values.map((item) => (
          <SelectItem
            className="min-w-14 pe-2 tabular-nums"
            disabled={isOptionDisabled(item)}
            key={item}
            value={item}
          >
            {pad(item)}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

function clampStep(step: number | undefined, maximum: number): number {
  if (!Number.isFinite(step) || !step) return 1;
  return Math.min(maximum, Math.max(1, Math.floor(step)));
}

function parseClock(value: string): number | undefined {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return undefined;
  return hour * 3600 + minute * 60 + second;
}

export function parseSelectableRange(
  selectableRange?: SelectableRange,
): ParsedRange[] {
  if (!selectableRange) return [];
  const values = Array.isArray(selectableRange)
    ? selectableRange
    : [selectableRange];

  return values.flatMap((item) => {
    const [startText, endText, ...rest] = item.split(/\s*-\s*/);
    if (!startText || !endText || rest.length > 0) return [];
    const start = parseClock(startText);
    const end = parseClock(endText);
    return start === undefined || end === undefined || start > end
      ? []
      : [[start, end] as const];
  });
}

export function applyTimeValue(base: Date, value: string | Date): Date {
  const target = new Date(base);
  if (value instanceof Date) {
    target.setHours(
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      0,
    );
    return target;
  }

  const total = parseClock(value) ?? 0;
  target.setHours(
    Math.floor(total / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
    0,
  );
  return target;
}

export function formatTimeValue(date: Date, showSeconds = false): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const result = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return showSeconds ? `${result}:${pad(date.getSeconds())}` : result;
}

function isAllowedWithRanges(
  date: Date,
  options: TimeConstraintOptions,
  ranges: ParsedRange[],
): boolean {
  const hourStep = clampStep(options.hourStep, 24);
  const minuteStep = clampStep(options.minuteStep, 60);
  const secondStep = clampStep(options.secondStep, 60);
  const second = options.showSeconds ? date.getSeconds() : 0;

  if (
    date.getHours() % hourStep !== 0 ||
    date.getMinutes() % minuteStep !== 0 ||
    (options.showSeconds && second % secondStep !== 0)
  ) {
    return false;
  }

  if (options.selectableRange) {
    if (ranges.length === 0) return false;
    const total = date.getHours() * 3600 + date.getMinutes() * 60 + second;
    if (!ranges.some(([start, end]) => total >= start && total <= end)) {
      return false;
    }
  }

  const config = options.disabledTime?.(date, options.role ?? "single");
  if (config?.disabledHours?.includes(date.getHours())) return false;
  if (config?.disabledMinutes?.(date.getHours()).includes(date.getMinutes())) {
    return false;
  }
  if (
    options.showSeconds &&
    config?.disabledSeconds
      ? config
          .disabledSeconds(date.getHours(), date.getMinutes())
          .includes(second)
      : false
  ) {
    return false;
  }

  return true;
}

export function isTimeAllowed(
  date: Date | undefined,
  options: TimeConstraintOptions = {},
): boolean {
  if (!date) return false;
  return isAllowedWithRanges(
    date,
    options,
    parseSelectableRange(options.selectableRange),
  );
}

function valuesForStep(maximum: number, step: number, current?: number): number[] {
  const values = Array.from(
    { length: Math.ceil(maximum / step) },
    (_, index) => index * step,
  ).filter((value) => value < maximum);
  if (current !== undefined && !values.includes(current)) values.push(current);
  return values.sort((a, b) => a - b);
}

function findAllowedTime(
  base: Date,
  options: TimeConstraintOptions,
  ranges: ParsedRange[],
  fixed?: FixedTime,
): Date | undefined {
  const hours =
    fixed?.hour !== undefined
      ? [fixed.hour]
      : valuesForStep(24, clampStep(options.hourStep, 24));
  const minutes =
    fixed?.minute !== undefined
      ? [fixed.minute]
      : valuesForStep(60, clampStep(options.minuteStep, 60));
  const seconds = options.showSeconds
    ? fixed?.second !== undefined
      ? [fixed.second]
      : valuesForStep(60, clampStep(options.secondStep, 60))
    : [0];

  for (const hour of hours) {
    for (const minute of minutes) {
      for (const second of seconds) {
        const candidate = new Date(base);
        candidate.setHours(hour, minute, second, 0);
        if (isAllowedWithRanges(candidate, options, ranges)) return candidate;
      }
    }
  }
  return undefined;
}

export function findFirstAllowedTime(
  base: Date,
  options: TimeConstraintOptions = {},
): Date | undefined {
  return findAllowedTime(
    base,
    options,
    parseSelectableRange(options.selectableRange),
  );
}

export function TimePickerPanel({
  value,
  onChange,
  onValidityChange,
  disabled = false,
  className,
  label,
  orientation = "horizontal",
  selectableRange,
  disabledTime,
  role = "single",
  showSeconds = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
}: TimePickerPanelProps): React.ReactElement {
  const t = useEasyT();
  const isCompact = orientation === "compact";
  const isDense = isCompact && showSeconds;
  const options = React.useMemo<TimeConstraintOptions>(
    () => ({
      selectableRange,
      disabledTime,
      role,
      showSeconds,
      hourStep,
      minuteStep,
      secondStep,
    }),
    [
      disabledTime,
      hourStep,
      minuteStep,
      role,
      secondStep,
      selectableRange,
      showSeconds,
    ],
  );
  const ranges = React.useMemo(
    () => parseSelectableRange(selectableRange),
    [selectableRange],
  );
  const base = React.useMemo(
    () => value ?? new Date(2000, 0, 1, 0, 0, 0, 0),
    [value],
  );
  const hours = valuesForStep(24, clampStep(hourStep, 24), base.getHours());
  const minutes = valuesForStep(
    60,
    clampStep(minuteStep, 60),
    base.getMinutes(),
  );
  const seconds = valuesForStep(
    60,
    clampStep(secondStep, 60),
    base.getSeconds(),
  );
  const valid = Boolean(value && isAllowedWithRanges(value, options, ranges));

  React.useEffect(() => {
    onValidityChange?.(valid);
  }, [onValidityChange, valid]);

  const changeUnit = React.useCallback(
    (unit: TimeUnit, nextValue: number) => {
      const candidate = new Date(base);
      if (unit === "hour") candidate.setHours(nextValue);
      if (unit === "minute") candidate.setMinutes(nextValue);
      if (unit === "second") candidate.setSeconds(nextValue);
      if (!showSeconds) candidate.setSeconds(0, 0);

      const next = isAllowedWithRanges(candidate, options, ranges)
        ? candidate
        : findAllowedTime(
            candidate,
            options,
            ranges,
            unit === "hour"
              ? { hour: nextValue }
              : unit === "minute"
                ? { hour: candidate.getHours(), minute: nextValue }
                : {
                    hour: candidate.getHours(),
                    minute: candidate.getMinutes(),
                    second: nextValue,
                  },
          );
      if (next) onChange?.(next);
    },
    [base, onChange, options, ranges, showSeconds],
  );

  const optionDisabled = (unit: TimeUnit, option: number): boolean => {
    const fixed =
      unit === "hour"
        ? { hour: option }
        : unit === "minute"
          ? { hour: base.getHours(), minute: option }
          : {
              hour: base.getHours(),
              minute: base.getMinutes(),
              second: option,
            };
    return !findAllowedTime(base, options, ranges, fixed);
  };
  return (
    <div
      aria-label={typeof label === "string" ? label : undefined}
      className={cn(
        "min-w-0",
        isCompact
          ? "flex w-full flex-col items-stretch gap-1"
          : "inline-flex items-center gap-1.5",
        disabled && "opacity-64",
        className,
      )}
      data-orientation={orientation}
      data-slot="time-picker-panel"
      role="group"
    >
      <span
        className={cn(
          "inline-flex min-h-5 items-center gap-1.5",
          isCompact && "w-full min-w-0 gap-1 overflow-hidden",
        )}
        data-slot="time-picker-panel-label"
      >
        <ClockIcon
          aria-hidden="true"
          className={cn(
            "shrink-0 text-muted-foreground",
            isCompact ? "size-3.5" : "size-4",
          )}
        />
        {label && (
          <span
            className={cn(
              "whitespace-nowrap text-xs text-muted-foreground",
              isCompact && "min-w-0 truncate",
            )}
          >
            {label}
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center",
          isCompact
            ? cn(
                "w-full shrink-0 whitespace-nowrap",
                isDense ? "gap-px" : "gap-0.5",
              )
            : "gap-1.5",
        )}
        data-slot="time-picker-panel-fields"
      >
        <TimeUnitSelect
          compact={isCompact}
          dense={isDense}
          disabled={disabled || !value}
          isOptionDisabled={(item) => optionDisabled("hour", item)}
          label={t("datePicker.hour")}
          onChange={(item) => changeUnit("hour", item)}
          value={base.getHours()}
          values={hours}
        />
        <span aria-hidden="true" className="text-muted-foreground">
          :
        </span>
        <TimeUnitSelect
          compact={isCompact}
          dense={isDense}
          disabled={disabled || !value}
          isOptionDisabled={(item) => optionDisabled("minute", item)}
          label={t("datePicker.minute")}
          onChange={(item) => changeUnit("minute", item)}
          value={base.getMinutes()}
          values={minutes}
        />
        {showSeconds && (
          <>
            <span aria-hidden="true" className="text-muted-foreground">
              :
            </span>
            <TimeUnitSelect
              compact={isCompact}
              dense={isDense}
              disabled={disabled || !value}
              isOptionDisabled={(item) => optionDisabled("second", item)}
              label={t("datePicker.second")}
              onChange={(item) => changeUnit("second", item)}
              value={base.getSeconds()}
              values={seconds}
            />
          </>
        )}
      </span>
    </div>
  );
}
