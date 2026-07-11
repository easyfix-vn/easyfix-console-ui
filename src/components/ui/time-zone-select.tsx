"use client";

import * as React from "react";
import { useEasyT } from "@/i18n";
import { useConfig } from "@/components/ui/config-provider";
import { cn } from "@/lib/utils";
import {
  getDateTimeZoneTag,
  getSystemTimeZone,
  getTimeZoneOptions,
  getTimeZoneOptionTag,
  normalizeDateTimeZone,
  type TimeZoneOption,
} from "@/lib/date-time-zone";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimezoneSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: TimeZoneOption[];
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
};

export type TimeZoneSelectProps = TimezoneSelectProps;

export function TimeZoneTag({
  timeZone,
  className,
}: {
  timeZone: string;
  className?: string;
}): React.ReactElement {
  return (
    <span
      className={cn(
        "ms-auto inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-2 font-mono text-[11px] font-medium leading-none text-muted-foreground",
        className,
      )}
      data-slot="time-zone-tag"
    >
      {getDateTimeZoneTag(timeZone)}
    </span>
  );
}

function getOptionName(option: TimeZoneOption, t: (key: string) => string): string {
  if (option.nameKey) {
    return t(`timeZone.options.${option.nameKey}`);
  }

  return option.label ?? option.description ?? option.value;
}

export function TimezoneSelect({
  value,
  defaultValue,
  onValueChange,
  options,
  disabled,
  label,
  className,
}: TimezoneSelectProps): React.ReactElement {
  const t = useEasyT();
  const { timeZone: configTimeZone } = useConfig();
  const [internalTimeZone, setInternalTimeZone] = React.useState(() =>
    normalizeDateTimeZone(defaultValue ?? configTimeZone),
  );
  const resolvedValue = normalizeDateTimeZone(value ?? internalTimeZone);

  React.useEffect(() => {
    if (value === undefined && defaultValue === undefined) {
      setInternalTimeZone(configTimeZone);
    }
  }, [configTimeZone, defaultValue, value]);

  const resolvedOptions = React.useMemo(
    () => getTimeZoneOptions(options, resolvedValue),
    [options, resolvedValue],
  );
  const browserTimeZone = React.useMemo(
    () => normalizeDateTimeZone(getSystemTimeZone()),
    [],
  );
  const browserOptionValue = React.useMemo(() => {
    const exactMatch = resolvedOptions.find(
      (option) => option.value === browserTimeZone,
    );
    if (exactMatch) {
      return exactMatch.value;
    }

    const browserOffset = getDateTimeZoneTag(browserTimeZone);
    return resolvedOptions.find(
      (option) => getTimeZoneOptionTag(option) === browserOffset,
    )?.value;
  }, [browserTimeZone, resolvedOptions]);
  const selectedOption = resolvedOptions.find(
    (option) => option.value === resolvedValue,
  );
  const selectedName = selectedOption
    ? getOptionName(selectedOption, t)
    : resolvedValue;
  const selectedTag = selectedOption
    ? getTimeZoneOptionTag(selectedOption)
    : getDateTimeZoneTag(resolvedValue);
  const currentTimeZoneLabel = t("timeZone.current");

  return (
    <div
      className={cn("flex flex-nowrap items-center justify-between gap-2", className)}
      data-slot="timezone-select"
    >
      {label && (
        <span className="shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <Select
        value={resolvedValue}
        onValueChange={(nextValue) => {
          if (nextValue) {
            if (value === undefined) {
              setInternalTimeZone(nextValue);
            }
            onValueChange?.(nextValue);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="h-7 min-h-7 min-w-44 max-w-full flex-1 rounded-full bg-muted/60 px-2.5 text-xs leading-none shadow-none sm:min-h-7 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1"
        >
          <SelectValue placeholder={t("timeZone.placeholder")}>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 font-mono">
                {selectedTag}
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                {selectedName}
              </span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectPopup
          alignItemWithTrigger={false}
          className="min-w-[min(34rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]"
        >
          {resolvedOptions.map((option) => {
            const optionName = getOptionName(option, t);
            const optionTag = getTimeZoneOptionTag(option);
            const isBrowserTimeZone = option.value === browserOptionValue;
            const itemLabel = [
              optionTag,
              optionName,
              isBrowserTimeZone ? currentTimeZoneLabel : undefined,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <SelectItem
                key={option.value}
                label={itemLabel}
                value={option.value}
              >
                <span className="flex w-full min-w-0 items-center gap-3 whitespace-nowrap">
                  <span className="w-20 shrink-0 font-mono">
                    {optionTag}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {optionName}
                  </span>
                  {isBrowserTimeZone && (
                    <span className="ms-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {currentTimeZoneLabel}
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectPopup>
      </Select>
    </div>
  );
}

// Backwards-compatible alias for the previous component name.
export const TimeZoneSelect = TimezoneSelect;
