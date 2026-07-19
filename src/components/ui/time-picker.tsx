"use client";

import { ClockIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useConfig } from "@/components/ui/config-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { TimezoneSelect, TimeZoneTag } from "@/components/ui/time-zone-select";
import {
  applyTimeValue,
  findFirstAllowedTime,
  isTimeAllowed,
  TimePickerPanel,
  type DisabledTime,
  type SelectableRange,
  type TimeConstraintOptions,
} from "@/components/ui/time-picker-panel";
import { useEasyI18n, useEasyT } from "@/i18n";
import {
  DEFAULT_TIME_TEMPLATES,
  type DateFormatter,
  resolveFormatter,
} from "@/lib/format-date";
import {
  calendarDateToZonedDate,
  normalizeDateTimeZone,
  toZonedCalendarDate,
  type TimeZoneOption,
  type TimestampRangeValue,
} from "@/lib/date-time-zone";
import { cn } from "@/lib/utils";

type TimePickerBaseProps = {
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  selectableRange?: SelectableRange;
  disabledTime?: DisabledTime;
  showSeconds?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  format?: DateFormatter;
  timeZone?: string;
  defaultTimeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
  timeZoneOptions?: TimeZoneOption[];
  showTimeZone?: boolean;
};

export type TimePickerProps = TimePickerBaseProps & {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  onTimestampChange?: (timestamp: number | undefined) => void;
  defaultTime?: string | Date;
};

export type TimeRangeValue = { from?: Date; to?: Date };

export type TimeRangePickerProps = TimePickerBaseProps & {
  value?: TimeRangeValue;
  onChange?: (range: TimeRangeValue | undefined) => void;
  onTimestampChange?: (range: TimestampRangeValue | undefined) => void;
  defaultTime?: readonly [string | Date, string | Date];
  separator?: React.ReactNode;
};

function useResolvedTimeZone({
  timeZone,
  defaultTimeZone,
  onTimeZoneChange,
}: Pick<
  TimePickerBaseProps,
  "timeZone" | "defaultTimeZone" | "onTimeZoneChange"
>) {
  const { timeZone: configTimeZone } = useConfig();
  const [internalTimeZone, setInternalTimeZone] = React.useState(() =>
    normalizeDateTimeZone(defaultTimeZone ?? configTimeZone),
  );

  React.useEffect(() => {
    if (timeZone === undefined) {
      setInternalTimeZone(
        normalizeDateTimeZone(defaultTimeZone ?? configTimeZone),
      );
    }
  }, [configTimeZone, defaultTimeZone, timeZone]);

  const resolvedTimeZone = normalizeDateTimeZone(timeZone ?? internalTimeZone);
  const updateTimeZone = React.useCallback(
    (nextTimeZone: string) => {
      const normalized = normalizeDateTimeZone(nextTimeZone);
      if (timeZone === undefined) setInternalTimeZone(normalized);
      onTimeZoneChange?.(normalized);
      return normalized;
    },
    [onTimeZoneChange, timeZone],
  );

  return { resolvedTimeZone, updateTimeZone };
}

function getTimeOfDay(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function getInitialCalendarTime({
  value,
  defaultTime,
  resolvedTimeZone,
  constraints,
}: {
  value?: Date;
  defaultTime: string | Date;
  resolvedTimeZone: string;
  constraints: TimeConstraintOptions;
}): Date | undefined {
  const zonedValue = toZonedCalendarDate(value, resolvedTimeZone);
  const zonedNow =
    toZonedCalendarDate(new Date(), resolvedTimeZone) ?? new Date();
  const candidate = zonedValue ?? applyTimeValue(zonedNow, defaultTime);
  return isTimeAllowed(candidate, constraints)
    ? candidate
    : findFirstAllowedTime(candidate, constraints);
}

export function TimePicker({
  value,
  onChange,
  onTimestampChange,
  defaultTime = "00:00:00",
  placeholder,
  disabled = false,
  clearable = true,
  className,
  selectableRange,
  disabledTime,
  showSeconds = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  format,
  timeZone,
  defaultTimeZone,
  onTimeZoneChange,
  timeZoneOptions,
  showTimeZone = true,
}: TimePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [pendingDate, setPendingDate] = React.useState<Date | undefined>(value);
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const { resolvedTimeZone, updateTimeZone } = useResolvedTimeZone({
    timeZone,
    defaultTimeZone,
    onTimeZoneChange,
  });
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
  const calendarValue = React.useMemo(
    () => toZonedCalendarDate(value, resolvedTimeZone),
    [resolvedTimeZone, value],
  );
  const activeCalendarValue = React.useMemo(
    () =>
      toZonedCalendarDate(open ? pendingDate : value, resolvedTimeZone),
    [open, pendingDate, resolvedTimeZone, value],
  );
  const formatter = React.useMemo(
    () =>
      resolveFormatter(
        format,
        showSeconds
          ? `${DEFAULT_TIME_TEMPLATES[locale]}:ss`
          : DEFAULT_TIME_TEMPLATES[locale],
      ),
    [format, locale, showSeconds],
  );

  const emitValue = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      onTimestampChange?.(date?.getTime());
    },
    [onChange, onTimestampChange],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        const calendarDate = getInitialCalendarTime({
          value,
          defaultTime,
          resolvedTimeZone,
          constraints,
        });
        setPendingDate(
          calendarDate
            ? calendarDateToZonedDate(
                calendarDate,
                resolvedTimeZone,
                "dateTime",
              )
            : undefined,
        );
      }
      setOpen(nextOpen);
    },
    [constraints, defaultTime, resolvedTimeZone, value],
  );

  const handleTimeZoneChange = React.useCallback(
    (nextTimeZone: string) => {
      const currentCalendar = toZonedCalendarDate(
        open ? pendingDate : value,
        resolvedTimeZone,
      );
      const normalized = updateTimeZone(nextTimeZone);
      if (currentCalendar) {
        setPendingDate(
          calendarDateToZonedDate(currentCalendar, normalized, "dateTime"),
        );
      }
    },
    [open, pendingDate, resolvedTimeZone, updateTimeZone, value],
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

  const valid = isTimeAllowed(activeCalendarValue, constraints);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            className={cn(
              "w-56 justify-start text-start font-normal",
              !value && "text-muted-foreground",
              className,
            )}
            variant="outline"
          />
        }
      >
        <ClockIcon className="size-4" />
        <span className="min-w-0 flex-1 truncate">
          {calendarValue
            ? formatter(calendarValue)
            : placeholder ?? t("datePicker.placeholderTime")}
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
        className="w-auto max-w-[calc(100vw-1rem)] p-0"
        viewportClassName="!p-0 [--viewport-inline-padding:0px]"
      >
        {showTimeZone && (
          <div className="flex justify-center border-b px-3 py-2">
            <TimezoneSelect
              className="w-60 max-w-full"
              disabled={disabled}
              onValueChange={handleTimeZoneChange}
              options={timeZoneOptions}
              value={resolvedTimeZone}
            />
          </div>
        )}
        <div className="flex justify-center p-3">
          <TimePickerPanel
            {...constraints}
            disabled={disabled}
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
        </div>
        <div className="flex justify-end border-t px-3 py-2">
          <Button
            disabled={disabled || !pendingDate || !valid}
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
      </PopoverPopup>
    </Popover>
  );
}

export function TimeRangePicker({
  value,
  onChange,
  onTimestampChange,
  defaultTime = ["00:00:00", "23:59:59"],
  separator,
  placeholder,
  disabled = false,
  clearable = true,
  className,
  selectableRange,
  disabledTime,
  showSeconds = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  format,
  timeZone,
  defaultTimeZone,
  onTimeZoneChange,
  timeZoneOptions,
  showTimeZone = true,
}: TimeRangePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [pendingRange, setPendingRange] = React.useState<
    TimeRangeValue | undefined
  >(value);
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const { resolvedTimeZone, updateTimeZone } = useResolvedTimeZone({
    timeZone,
    defaultTimeZone,
    onTimeZoneChange,
  });
  const baseConstraints = React.useMemo(
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
  const formatter = React.useMemo(
    () =>
      resolveFormatter(
        format,
        showSeconds
          ? `${DEFAULT_TIME_TEMPLATES[locale]}:ss`
          : DEFAULT_TIME_TEMPLATES[locale],
      ),
    [format, locale, showSeconds],
  );
  const calendarRange = React.useMemo(
    () => ({
      from: toZonedCalendarDate(value?.from, resolvedTimeZone),
      to: toZonedCalendarDate(value?.to, resolvedTimeZone),
    }),
    [resolvedTimeZone, value],
  );
  const activeRange = open ? pendingRange : value;
  const activeCalendarRange = React.useMemo(
    () => ({
      from: toZonedCalendarDate(activeRange?.from, resolvedTimeZone),
      to: toZonedCalendarDate(activeRange?.to, resolvedTimeZone),
    }),
    [activeRange, resolvedTimeZone],
  );
  const sep = separator ?? t("datePicker.separator");

  const emitRange = React.useCallback(
    (range: TimeRangeValue | undefined) => {
      onChange?.(range);
      onTimestampChange?.(
        range
          ? { from: range.from?.getTime(), to: range.to?.getTime() }
          : undefined,
      );
    },
    [onChange, onTimestampChange],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        const fromCalendar = getInitialCalendarTime({
          value: value?.from,
          defaultTime: defaultTime[0],
          resolvedTimeZone,
          constraints: { ...baseConstraints, role: "start" },
        });
        const toCalendar = getInitialCalendarTime({
          value: value?.to,
          defaultTime: defaultTime[1],
          resolvedTimeZone,
          constraints: { ...baseConstraints, role: "end" },
        });
        setPendingRange({
          from: fromCalendar
            ? calendarDateToZonedDate(
                fromCalendar,
                resolvedTimeZone,
                "dateTime",
              )
            : undefined,
          to: toCalendar
            ? calendarDateToZonedDate(
                toCalendar,
                resolvedTimeZone,
                "dateTime",
              )
            : undefined,
        });
      }
      setOpen(nextOpen);
    },
    [baseConstraints, defaultTime, resolvedTimeZone, value],
  );

  const handleTimeZoneChange = React.useCallback(
    (nextTimeZone: string) => {
      const normalized = updateTimeZone(nextTimeZone);
      setPendingRange({
        from: activeCalendarRange.from
          ? calendarDateToZonedDate(
              activeCalendarRange.from,
              normalized,
              "dateTime",
            )
          : undefined,
        to: activeCalendarRange.to
          ? calendarDateToZonedDate(
              activeCalendarRange.to,
              normalized,
              "dateTime",
            )
          : undefined,
      });
    },
    [activeCalendarRange, updateTimeZone],
  );

  const startValid = isTimeAllowed(activeCalendarRange.from, {
    ...baseConstraints,
    role: "start",
  });
  const endValid = isTimeAllowed(activeCalendarRange.to, {
    ...baseConstraints,
    role: "end",
  });
  const ordered = Boolean(
    activeCalendarRange.from &&
      activeCalendarRange.to &&
      getTimeOfDay(activeCalendarRange.from) <=
        getTimeOfDay(activeCalendarRange.to),
  );
  const hasValue = Boolean(value?.from ?? value?.to);
  const display = hasValue ? (
    <span className="inline-flex items-center gap-1.5">
      <span>{calendarRange.from ? formatter(calendarRange.from) : "..."}</span>
      <span className="text-muted-foreground">{sep}</span>
      <span>{calendarRange.to ? formatter(calendarRange.to) : "..."}</span>
    </span>
  ) : (
    placeholder ?? t("datePicker.placeholderTimeRange")
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            className={cn(
              "w-72 max-w-full justify-start text-start font-normal",
              !hasValue && "text-muted-foreground",
              className,
            )}
            variant="outline"
          />
        }
      >
        <ClockIcon className="size-4" />
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
        className="w-auto max-w-[calc(100vw-1rem)] p-0"
        viewportClassName="!p-0 [--viewport-inline-padding:0px]"
      >
        {showTimeZone && (
          <div className="flex justify-center border-b px-3 py-2">
            <TimezoneSelect
              className="w-60 max-w-full"
              disabled={disabled}
              onValueChange={handleTimeZoneChange}
              options={timeZoneOptions}
              value={resolvedTimeZone}
            />
          </div>
        )}
        <div className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center">
          <TimePickerPanel
            {...baseConstraints}
            disabled={disabled}
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
            role="start"
            value={activeCalendarRange.from}
          />
          <span className="text-xs text-muted-foreground">{sep}</span>
          <TimePickerPanel
            {...baseConstraints}
            disabled={disabled}
            label={t("datePicker.endTime")}
            onChange={(date) =>
              setPendingRange({
                from: pendingRange?.from,
                to: calendarDateToZonedDate(
                  date,
                  resolvedTimeZone,
                  "dateTime",
                ),
              })
            }
            role="end"
            value={activeCalendarRange.to}
          />
        </div>
        <div className="flex justify-end border-t px-3 py-2">
          <Button
            disabled={
              disabled ||
              !pendingRange?.from ||
              !pendingRange.to ||
              !startValid ||
              !endValid ||
              !ordered
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
