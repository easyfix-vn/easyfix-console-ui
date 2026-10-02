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
  type IanaTimeZone,
  type TimeZoneOption,
} from "@/lib/date-time-zone";
import {
  SearchableSelect,
  type SelectOption,
} from "@/components/ui/select";

export type TimezoneSelectProps = {
  value?: IanaTimeZone;
  defaultValue?: IanaTimeZone;
  onValueChange?: (value: IanaTimeZone) => void;
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
  timeZone: IanaTimeZone;
  className?: string;
}): React.ReactElement {
  return (
    <span
      className={cn(
        "ms-auto inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-2 font-mono text-xs font-medium leading-4 text-muted-foreground",
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

type TimeZoneGroupKey =
  | "africa"
  | "america"
  | "asia"
  | "europe"
  | "oceania"
  | "other";

const TIME_ZONE_GROUP_ORDER: Record<TimeZoneGroupKey, number> = {
  asia: 0,
  europe: 1,
  africa: 2,
  america: 3,
  oceania: 4,
  other: 5,
};

function getTimeZoneGroupKey(timeZone: IanaTimeZone): TimeZoneGroupKey {
  switch (timeZone.split("/")[0]) {
    case "Africa":
      return "africa";
    case "America":
      return "america";
    case "Asia":
      return "asia";
    case "Europe":
      return "europe";
    case "Australia":
    case "Pacific":
      return "oceania";
    default:
      return "other";
  }
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

  const browserTimeZone = React.useMemo(
    () => normalizeDateTimeZone(getSystemTimeZone()),
    [],
  );
  const resolvedOptions = React.useMemo(() => {
    const nextOptions = getTimeZoneOptions(options, resolvedValue);

    if (
      options?.length ||
      nextOptions.some((option) => option.value === browserTimeZone)
    ) {
      return nextOptions;
    }

    const browserOffset = getDateTimeZoneTag(browserTimeZone);
    const sameOffsetIndex = nextOptions.findIndex(
      (option) => getTimeZoneOptionTag(option) === browserOffset,
    );

    if (sameOffsetIndex >= 0) {
      return nextOptions.map((option, index) =>
        index === sameOffsetIndex
          ? {
              ...option,
              value: browserTimeZone,
              description: browserTimeZone,
              nameKey: undefined,
              label: undefined,
            }
          : option,
      );
    }

    return [
      { value: browserTimeZone, description: browserTimeZone },
      ...nextOptions,
    ];
  }, [browserTimeZone, options, resolvedValue]);
  const browserOptionValue = resolvedOptions.some(
    (option) => option.value === browserTimeZone,
  )
    ? browserTimeZone
    : undefined;
  const currentTimeZoneLabel = t("timeZone.current");
  const selectedTimeZoneOption = resolvedOptions.find(
    (option) => option.value === resolvedValue,
  );
  const selectedTimeZoneName = selectedTimeZoneOption
    ? getOptionName(selectedTimeZoneOption, t)
    : resolvedValue;
  const searchableOptions = React.useMemo<SelectOption<IanaTimeZone>[]>(
    () =>
      [...resolvedOptions]
        .sort(
          (left, right) =>
            TIME_ZONE_GROUP_ORDER[getTimeZoneGroupKey(left.value)] -
            TIME_ZONE_GROUP_ORDER[getTimeZoneGroupKey(right.value)],
        )
        .map((option) => {
        const optionName = getOptionName(option, t);
        const optionTag = getTimeZoneOptionTag(option);
        const isBrowserTimeZone = option.value === browserOptionValue;
        const group = t(
          `timeZone.groups.${getTimeZoneGroupKey(option.value)}`,
        );

        return {
          value: option.value,
          group,
          searchText: [optionTag, optionName, option.value, group].join(" "),
          label: (
            <span className="grid w-full min-w-0 grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-3 whitespace-nowrap">
              <span className="font-mono">{optionTag}</span>
              <span className="min-w-0 truncate text-muted-foreground">
                {optionName}
              </span>
              {isBrowserTimeZone && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {currentTimeZoneLabel}
                </span>
              )}
            </span>
          ),
        };
        }),
    [browserOptionValue, currentTimeZoneLabel, resolvedOptions, t],
  );

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
      <SearchableSelect
        value={resolvedValue}
        onValueChange={(nextValue) => {
          if (nextValue) {
            if (value === undefined) {
              setInternalTimeZone(nextValue);
            }
            onValueChange?.(nextValue);
          }
        }}
        options={searchableOptions}
        placeholder={t("timeZone.placeholder")}
        searchPlaceholder={t("timeZone.searchPlaceholder")}
        emptyText={t("timeZone.emptyText")}
        clearable={false}
        disabled={disabled}
        renderValue={() => (
          <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <span className="shrink-0 font-mono">
              {getDateTimeZoneTag(resolvedValue)}
            </span>
            <span
              className="min-w-0 truncate text-muted-foreground"
              title={selectedTimeZoneName}
            >
              {selectedTimeZoneName}
            </span>
          </span>
        )}
        popupClassName="min-w-[min(34rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]"
        size="sm"
        className="min-w-44 max-w-full flex-1 [&_[data-slot=popover-trigger]]:h-7 [&_[data-slot=popover-trigger]]:min-h-7 [&_[data-slot=popover-trigger]]:rounded-full [&_[data-slot=popover-trigger]]:bg-muted/60 [&_[data-slot=popover-trigger]]:px-2.5 [&_[data-slot=popover-trigger]]:text-xs [&_[data-slot=popover-trigger]]:leading-none [&_[data-slot=popover-trigger]]:shadow-none"
      />
    </div>
  );
}

// Backwards-compatible alias for the previous component name.
export const TimeZoneSelect = TimezoneSelect;
