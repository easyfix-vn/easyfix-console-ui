"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useEasyI18n, useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useMediaQuery } from "@/hooks/use-media-query";

export type DatePickerType = "date" | "month" | "year";
export type DisabledDate = (date: Date) => boolean;

type PickerView = "date" | "month" | "year";

export type DatePickerPanelProps = {
  mode?: "single" | "range";
  type?: DatePickerType;
  selectedDate?: Date;
  selectedRange?: DateRange;
  onDateSelect?: (date: Date | undefined) => void;
  onRangeSelect?: (range: DateRange | undefined) => void;
  disabledDate?: DisabledDate;
  defaultMonth?: Date;
  today?: Date;
  startYear?: number;
  endYear?: number;
  numberOfMonths?: number;
  className?: string;
  calendarClassNames?: React.ComponentProps<typeof Calendar>["classNames"];
  calendarStyle?: React.CSSProperties;
  onMonthChange?: (month: Date) => void;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function getMonthDays(year: number, month: number): Date[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from(
    { length: count },
    (_, index) => new Date(year, month, index + 1, 12),
  );
}

function isMonthDisabled(
  year: number,
  month: number,
  disabledDate?: DisabledDate,
): boolean {
  return Boolean(
    disabledDate &&
      getMonthDays(year, month).every((date) => disabledDate(date)),
  );
}

function isYearDisabled(year: number, disabledDate?: DisabledDate): boolean {
  return Boolean(
    disabledDate &&
      Array.from({ length: 12 }, (_, month) => month).every((month) =>
        isMonthDisabled(year, month, disabledDate),
      ),
  );
}

function isPickerMonthDisabled(
  type: DatePickerType,
  year: number,
  month: number,
  disabledDate?: DisabledDate,
): boolean {
  if (!disabledDate) return false;
  return type === "month"
    ? disabledDate(new Date(year, month, 1, 12))
    : isMonthDisabled(year, month, disabledDate);
}

function isPickerYearDisabled(
  type: DatePickerType,
  year: number,
  disabledDate?: DisabledDate,
): boolean {
  if (!disabledDate) return false;
  if (type === "year") return disabledDate(new Date(year, 0, 1, 12));
  if (type === "month") {
    return Array.from({ length: 12 }, (_, month) => month).every((month) =>
      disabledDate(new Date(year, month, 1, 12)),
    );
  }
  return isYearDisabled(year, disabledDate);
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 sm:size-7",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function DatePickerPanel({
  mode = "single",
  type = "date",
  selectedDate,
  selectedRange,
  onDateSelect,
  onRangeSelect,
  disabledDate,
  defaultMonth,
  today,
  startYear,
  endYear,
  numberOfMonths = 1,
  className,
  calendarClassNames,
  calendarStyle,
  onMonthChange,
}: DatePickerPanelProps): React.ReactElement {
  const { locale } = useEasyI18n();
  const t = useEasyT();
  const isNarrowRange = useMediaQuery("max-sm");
  const initialDate =
    selectedDate ?? selectedRange?.from ?? defaultMonth ?? today ?? new Date();
  const fallbackYear = initialDate.getFullYear();
  const minimumYear = Math.min(
    startYear ?? fallbackYear - 100,
    endYear ?? fallbackYear + 100,
  );
  const maximumYear = Math.max(
    startYear ?? fallbackYear - 100,
    endYear ?? fallbackYear + 100,
  );
  const availableMonthCount = (maximumYear - minimumYear + 1) * 12;
  const requestedPanelCount = Number.isFinite(numberOfMonths)
    ? Math.max(1, Math.floor(numberOfMonths))
    : 1;
  const panelCount =
    mode === "range"
      ? Math.min(
          isNarrowRange ? 1 : requestedPanelCount,
          availableMonthCount,
        )
      : 1;
  const minimumMonth = React.useMemo(
    () => new Date(minimumYear, 0, 1, 12),
    [minimumYear],
  );
  const maximumMonth = React.useMemo(
    () => new Date(maximumYear, 11, 1, 12),
    [maximumYear],
  );
  const maximumAnchorMonth = React.useMemo(
    () => addMonths(maximumMonth, -(panelCount - 1)),
    [maximumMonth, panelCount],
  );
  const clampAnchorMonth = React.useCallback(
    (date: Date) => {
      const next = startOfMonth(date);
      if (next.getTime() < minimumMonth.getTime()) return minimumMonth;
      if (next.getTime() > maximumAnchorMonth.getTime()) {
        return maximumAnchorMonth;
      }
      return next;
    },
    [maximumAnchorMonth, minimumMonth],
  );
  const [anchorMonth, setAnchorMonth] = React.useState(() =>
    clampAnchorMonth(initialDate),
  );
  const visibleAnchorMonth = clampAnchorMonth(anchorMonth);
  const [panelViews, setPanelViews] = React.useState<
    Record<number, PickerView>
  >(() => ({ 0: mode === "range" ? "date" : type }));

  const updatePanelMonth = React.useCallback(
    (panelIndex: number, date: Date) => {
      const nextAnchor = clampAnchorMonth(addMonths(date, -panelIndex));
      setAnchorMonth(nextAnchor);
      onMonthChange?.(nextAnchor);
    },
    [clampAnchorMonth, onMonthChange],
  );
  const updatePanelView = React.useCallback(
    (panelIndex: number, view: PickerView) => {
      setPanelViews((current) => ({ ...current, [panelIndex]: view }));
    },
    [],
  );

  return (
    <div
      className={cn(
        mode === "single"
          ? "w-fit max-w-full"
          : "flex w-fit max-w-full divide-x divide-border",
        className,
      )}
      data-slot="date-picker-panel"
    >
      {Array.from({ length: panelCount }, (_, panelIndex) => {
        const visibleMonth = addMonths(visibleAnchorMonth, panelIndex);
        const view = panelViews[panelIndex] ?? "date";
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        const decadeStart = Math.floor(year / 10) * 10;
        const years = Array.from(
          { length: 10 },
          (_, yearIndex) => decadeStart + yearIndex,
        );
        const months = Array.from({ length: 12 }, (_, monthIndex) => monthIndex);
        const yearText = new Intl.DateTimeFormat(locale, {
          year: "numeric",
        }).format(new Date(year, 6, 1, 12));
        const monthText = new Intl.DateTimeFormat(locale, {
          month: "long",
        }).format(new Date(year, month, 1, 12));
        const canGoPreviousMonth =
          addMonths(visibleAnchorMonth, -1).getTime() >= minimumMonth.getTime();
        const canGoNextMonth =
          addMonths(visibleAnchorMonth, 1).getTime() <=
          maximumAnchorMonth.getTime();
        const canGoPreviousYear =
          addMonths(visibleAnchorMonth, -12).getTime() >=
          minimumMonth.getTime();
        const canGoNextYear =
          addMonths(visibleAnchorMonth, 12).getTime() <=
          maximumAnchorMonth.getTime();
        const canGoPreviousDecade =
          addMonths(visibleAnchorMonth, -120).getTime() >=
          minimumMonth.getTime();
        const canGoNextDecade =
          addMonths(visibleAnchorMonth, 120).getTime() <=
          maximumAnchorMonth.getTime();
        const hierarchyType = mode === "range" ? "date" : type;
        const hierarchySelectedDates =
          mode === "range"
            ? [selectedRange?.from, selectedRange?.to]
            : [selectedDate];
        const showPreviousDateNavigation =
          mode !== "range" || panelCount === 1 || panelIndex === 0;
        const showNextDateNavigation =
          mode !== "range" ||
          panelCount === 1 ||
          panelIndex === panelCount - 1;

        const selectYear = (nextYear: number) => {
          if (
            nextYear < minimumYear ||
            nextYear > maximumYear ||
            isPickerYearDisabled(hierarchyType, nextYear, disabledDate)
          ) {
            return;
          }
          updatePanelMonth(
            panelIndex,
            new Date(nextYear, month, 1, 12),
          );
          if (mode === "single" && type === "year") {
            onDateSelect?.(new Date(nextYear, 0, 1, 12));
            return;
          }
          updatePanelView(panelIndex, "month");
        };

        const selectMonth = (nextMonth: number) => {
          if (
            isPickerMonthDisabled(
              hierarchyType,
              year,
              nextMonth,
              disabledDate,
            )
          ) {
            return;
          }
          const next = new Date(year, nextMonth, 1, 12);
          updatePanelMonth(panelIndex, next);
          if (mode === "single" && type === "month") {
            onDateSelect?.(next);
            return;
          }
          updatePanelView(panelIndex, "date");
        };

        return (
          <section
            className={cn(
              mode === "range"
                ? "w-[14.25rem] max-w-full"
                : view === "date"
                  ? "w-fit max-w-full"
                  : "w-60 max-w-full",
              mode === "range" && panelIndex > 0 && "max-sm:hidden",
            )}
            data-panel-index={panelIndex}
            key={`date-picker-panel-${panelIndex}`}
          >
            <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center border-b px-2">
              <div className="flex min-w-0 items-center">
                {view === "date" && showPreviousDateNavigation && (
                  <>
                    <IconButton
                      className={mode === "range" ? "max-sm:hidden" : undefined}
                      disabled={!canGoPreviousYear}
                      label={t("datePicker.previousYear")}
                      onClick={() =>
                        updatePanelMonth(
                          panelIndex,
                          new Date(year - 1, month, 1, 12),
                        )
                      }
                    >
                      <ChevronsLeftIcon className="size-4" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      disabled={!canGoPreviousMonth}
                      label={t("datePicker.previousMonth")}
                      onClick={() =>
                        updatePanelMonth(
                          panelIndex,
                          addMonths(visibleMonth, -1),
                        )
                      }
                    >
                      <ChevronLeftIcon className="size-4" aria-hidden="true" />
                    </IconButton>
                  </>
                )}
                {view === "month" && (
                  <IconButton
                    disabled={!canGoPreviousYear}
                    label={t("datePicker.previousYear")}
                    onClick={() =>
                      updatePanelMonth(
                        panelIndex,
                        new Date(year - 1, month, 1, 12),
                      )
                    }
                  >
                    <ChevronsLeftIcon className="size-4" aria-hidden="true" />
                  </IconButton>
                )}
                {view === "year" && (
                  <IconButton
                    disabled={!canGoPreviousDecade}
                    label={t("datePicker.previousDecade")}
                    onClick={() =>
                      updatePanelMonth(
                        panelIndex,
                        new Date(year - 10, month, 1, 12),
                      )
                    }
                  >
                    <ChevronsLeftIcon className="size-4" aria-hidden="true" />
                  </IconButton>
                )}
              </div>

              <div className="flex min-w-0 items-center justify-center gap-0.5 whitespace-nowrap text-sm font-medium">
                {view === "year" ? (
                  <span className="whitespace-nowrap" aria-live="polite">
                    {Math.max(decadeStart, minimumYear)}–
                    {Math.min(decadeStart + 9, maximumYear)}
                  </span>
                ) : (
                  <>
                    <button
                      className="shrink-0 whitespace-nowrap rounded-md px-1 py-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => updatePanelView(panelIndex, "year")}
                      type="button"
                    >
                      {yearText}
                    </button>
                    {view === "date" && (
                      <button
                        className="shrink-0 whitespace-nowrap rounded-md px-1 py-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => updatePanelView(panelIndex, "month")}
                        type="button"
                      >
                        {monthText}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex min-w-0 items-center justify-end">
                {view === "date" && showNextDateNavigation && (
                  <>
                    <IconButton
                      disabled={!canGoNextMonth}
                      label={t("datePicker.nextMonth")}
                      onClick={() =>
                        updatePanelMonth(
                          panelIndex,
                          addMonths(visibleMonth, 1),
                        )
                      }
                    >
                      <ChevronRightIcon className="size-4" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      className={mode === "range" ? "max-sm:hidden" : undefined}
                      disabled={!canGoNextYear}
                      label={t("datePicker.nextYear")}
                      onClick={() =>
                        updatePanelMonth(
                          panelIndex,
                          new Date(year + 1, month, 1, 12),
                        )
                      }
                    >
                      <ChevronsRightIcon className="size-4" aria-hidden="true" />
                    </IconButton>
                  </>
                )}
                {view === "month" && (
                  <IconButton
                    disabled={!canGoNextYear}
                    label={t("datePicker.nextYear")}
                    onClick={() =>
                      updatePanelMonth(
                        panelIndex,
                        new Date(year + 1, month, 1, 12),
                      )
                    }
                  >
                    <ChevronsRightIcon className="size-4" aria-hidden="true" />
                  </IconButton>
                )}
                {view === "year" && (
                  <IconButton
                    disabled={!canGoNextDecade}
                    label={t("datePicker.nextDecade")}
                    onClick={() =>
                      updatePanelMonth(
                        panelIndex,
                        new Date(year + 10, month, 1, 12),
                      )
                    }
                  >
                    <ChevronsRightIcon className="size-4" aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            </div>

            {view === "date" &&
              (mode === "range" ? (
                <Calendar
                  className="mx-auto w-fit max-w-full p-2"
                  classNames={{
                    ...calendarClassNames,
                    month_caption: cn(
                      calendarClassNames?.month_caption,
                      "hidden",
                    ),
                    nav: cn(calendarClassNames?.nav, "hidden"),
                  }}
                  disabled={disabledDate}
                  endMonth={maximumMonth}
                  mode="range"
                  month={visibleMonth}
                  numberOfMonths={1}
                  onMonthChange={(nextMonth) =>
                    updatePanelMonth(panelIndex, nextMonth)
                  }
                  onSelect={onRangeSelect}
                  resetOnSelect
                  required
                  selected={selectedRange}
                  startMonth={minimumMonth}
                  style={calendarStyle}
                  today={today}
                />
              ) : (
                <Calendar
                  className="mx-auto w-fit max-w-full p-2"
                  classNames={{
                    ...calendarClassNames,
                    month_caption: cn(
                      calendarClassNames?.month_caption,
                      "hidden",
                    ),
                    nav: cn(calendarClassNames?.nav, "hidden"),
                  }}
                  disabled={disabledDate}
                  endMonth={maximumMonth}
                  mode="single"
                  month={visibleMonth}
                  onMonthChange={(nextMonth) =>
                    updatePanelMonth(panelIndex, nextMonth)
                  }
                  onSelect={onDateSelect}
                  selected={selectedDate}
                  startMonth={minimumMonth}
                  style={calendarStyle}
                  today={today}
                />
              ))}

            {view === "month" && (
              <div
                className="grid w-full grid-cols-4 gap-1 p-2"
                role="grid"
              >
                {months.map((item) => {
                  const itemDisabled = isPickerMonthDisabled(
                    hierarchyType,
                    year,
                    item,
                    disabledDate,
                  );
                  const selected = hierarchySelectedDates.some(
                    (date) =>
                      date?.getFullYear() === year && date.getMonth() === item,
                  );
                  const label = new Intl.DateTimeFormat(locale, {
                    month: "short",
                  }).format(new Date(year, item, 1, 12));
                  return (
                    <button
                      aria-selected={selected}
                      className={cn(
                        "h-10 rounded-lg px-1 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:text-muted-foreground/50",
                        selected &&
                          "bg-primary text-primary-foreground hover:bg-primary",
                      )}
                      disabled={itemDisabled}
                      key={item}
                      onClick={() => selectMonth(item)}
                      role="gridcell"
                      type="button"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {view === "year" && (
              <div
                className="grid w-full grid-cols-4 gap-1 p-2"
                role="grid"
              >
                {years.map((item) => {
                  const itemDisabled =
                    item < minimumYear ||
                    item > maximumYear ||
                    isPickerYearDisabled(hierarchyType, item, disabledDate);
                  const selected = hierarchySelectedDates.some(
                    (date) => date?.getFullYear() === item,
                  );
                  return (
                    <button
                      aria-selected={selected}
                      className={cn(
                        "h-10 rounded-lg px-1 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:text-muted-foreground/50",
                        selected &&
                          "bg-primary text-primary-foreground hover:bg-primary",
                      )}
                      disabled={itemDisabled}
                      key={item}
                      onClick={() => selectYear(item)}
                      role="gridcell"
                      type="button"
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
