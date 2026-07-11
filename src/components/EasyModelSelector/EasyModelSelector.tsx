"use client";

import * as React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

export type EasyModelSelectorSize = "sm" | "default" | "lg";

export type EasyModelSelectorValue =
  | "light"
  | "medium"
  | "high"
  | "extra-high"
  | "ultra"
  | (string & {});

export type EasyModelSelectorOption = {
  value: EasyModelSelectorValue;
  label: React.ReactNode;
  description?: React.ReactNode;
  color?: string;
  disabled?: boolean;
};

export interface EasyModelSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: EasyModelSelectorValue;
  defaultValue?: EasyModelSelectorValue;
  onValueChange?: (
    value: EasyModelSelectorValue,
    option: EasyModelSelectorOption,
    index: number,
  ) => void;
  modelName?: React.ReactNode;
  options?: EasyModelSelectorOption[];
  size?: EasyModelSelectorSize;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  align?: "start" | "center" | "end";
}

export const EASY_MODEL_SELECTOR_OPTIONS: EasyModelSelectorOption[] = [
  {
    value: "light",
    label: "Light",
    description: "快速响应，适合轻量任务",
    color: "#22c55e",
  },
  {
    value: "medium",
    label: "Medium",
    description: "速度和能力均衡",
    color: "#06b6d4",
  },
  {
    value: "high",
    label: "High",
    description: "更强推理与复杂任务",
    color: "#3b82f6",
  },
  {
    value: "extra-high",
    label: "Extra High",
    description: "高难度分析和规划",
    color: "#8b5cf6",
  },
  {
    value: "ultra",
    label: "Ultra",
    description: "最高智能档位",
    color: "#d946ef",
  },
];

const selectorSizeClassNames: Record<EasyModelSelectorSize, string> = {
  sm: "min-h-8 px-2.5 text-xs",
  default: "min-h-9 px-3 text-sm",
  lg: "min-h-10 px-3.5 text-sm",
};

const popupWidthClassNames: Record<EasyModelSelectorSize, string> = {
  sm: "w-72",
  default: "w-80",
  lg: "w-88",
};

function clampIndex(index: number, maxIndex: number): number {
  return Math.min(Math.max(index, 0), maxIndex);
}

function findEnabledIndex(
  options: EasyModelSelectorOption[],
  preferredIndex: number,
): number {
  if (!options[preferredIndex]?.disabled) {
    return preferredIndex;
  }

  const nextIndex = options.findIndex((option) => !option.disabled);
  return nextIndex >= 0 ? nextIndex : 0;
}

export const EasyModelSelector = React.forwardRef<
  HTMLDivElement,
  EasyModelSelectorProps
>(function EasyModelSelector(
  {
    value,
    defaultValue = "medium",
    onValueChange,
    modelName = "GPT-5.4",
    options = EASY_MODEL_SELECTOR_OPTIONS,
    size = "default",
    placeholder = "选择模型能力",
    disabled = false,
    align = "start",
    className,
    ...props
  },
  ref,
) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] =
    React.useState<EasyModelSelectorValue>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const currentValue = isControlled ? value : internalValue;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === currentValue),
  );
  const selectedOption = options[selectedIndex] ?? options[0];
  const maxIndex = Math.max(options.length - 1, 0);
  const progress = maxIndex === 0 ? 0 : (selectedIndex / maxIndex) * 100;
  const accentColor = selectedOption?.color ?? "#06b6d4";
  const gradient = options
    .map((option, index) => {
      const stop = maxIndex === 0 ? 0 : (index / maxIndex) * 100;
      return `${option.color ?? accentColor} ${stop}%`;
    })
    .join(", ");

  const commitIndex = React.useCallback(
    (rawIndex: number) => {
      if (disabled || options.length === 0) {
        return;
      }

      const nextIndex = findEnabledIndex(
        options,
        clampIndex(Math.round(rawIndex), maxIndex),
      );
      const nextOption = options[nextIndex];

      if (!nextOption || nextOption.disabled || nextOption.value === currentValue) {
        return;
      }

      if (!isControlled) {
        setInternalValue(nextOption.value);
      }
      onValueChange?.(nextOption.value, nextOption, nextIndex);
    },
    [currentValue, disabled, isControlled, maxIndex, onValueChange, options],
  );

  const commitFromClientX = React.useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();

      if (!rect || rect.width <= 0) {
        return;
      }

      const ratio = clampIndex((clientX - rect.left) / rect.width, 1);
      commitIndex(ratio * maxIndex);
    },
    [commitIndex, maxIndex],
  );

  const handleSliderKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        commitIndex(selectedIndex - 1);
      }

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        commitIndex(selectedIndex + 1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        commitIndex(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        commitIndex(maxIndex);
      }
    },
    [commitIndex, disabled, maxIndex, selectedIndex],
  );

  return (
    <div
      ref={ref}
      className={cn("inline-flex w-full max-w-sm", className)}
      data-slot="model-selector"
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <button
              className={cn(
                "relative inline-flex w-full min-w-0 items-center gap-2 rounded-full border border-input bg-background text-start text-foreground shadow-xs/5 outline-none ring-ring/24 transition before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/45 focus-visible:border-ring focus-visible:ring-[3px] data-disabled:pointer-events-none data-disabled:opacity-64 dark:bg-input/32 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
                selectorSizeClassNames[size],
              )}
              style={
                {
                  "--model-selector-accent": accentColor,
                } as React.CSSProperties
              }
              type="button"
            />
          }
        >
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full shadow-[0_0_0_3px_color-mix(in_srgb,var(--model-selector-accent)_16%,transparent)]"
            style={{ backgroundColor: accentColor }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">
              {selectedOption?.label ?? placeholder}
            </span>
            <span className="block truncate text-muted-foreground text-xs">
              {modelName}
            </span>
          </span>
          {selectedOption?.value === "ultra" && (
            <SparklesIcon className="size-4 text-fuchsia-500" />
          )}
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </PopoverTrigger>
        <PopoverPopup
          align={align}
          className={cn("p-0", popupWidthClassNames[size])}
          sideOffset={6}
        >
          <div
            className="overflow-hidden rounded-[inherit]"
            style={
              {
                "--model-selector-accent": accentColor,
              } as React.CSSProperties
            }
          >
            <div className="border-b bg-muted/40 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {modelName}
                  </div>
                  <div className="mt-0.5 truncate text-muted-foreground text-xs">
                    {selectedOption?.label ?? placeholder}
                  </div>
                </div>
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background px-2 py-1 text-muted-foreground text-xs shadow-xs/5">
                  <ZapIcon className="size-3.5 text-[var(--model-selector-accent)]" />
                  {selectedIndex + 1}/{options.length}
                </div>
              </div>
              <div
                ref={trackRef}
                aria-label="Model intelligence"
                aria-valuemax={maxIndex}
                aria-valuemin={0}
                aria-valuenow={selectedIndex}
                className={cn(
                  "relative mt-4 h-8 cursor-pointer touch-none select-none",
                  disabled && "pointer-events-none opacity-64",
                )}
                onKeyDown={handleSliderKeyDown}
                onPointerDown={(event) => {
                  if (disabled) {
                    return;
                  }
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDragging(true);
                  commitFromClientX(event.clientX);
                }}
                onPointerMove={(event) => {
                  if (dragging) {
                    commitFromClientX(event.clientX);
                  }
                }}
                onPointerUp={(event) => {
                  setDragging(false);
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                role="slider"
                tabIndex={disabled ? -1 : 0}
              >
                <div
                  className="absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full opacity-28"
                  style={{ background: `linear-gradient(90deg, ${gradient})` }}
                />
                <div
                  className="absolute start-1 top-1/2 h-2 -translate-y-1/2 rounded-full transition-[width] duration-200"
                  style={{
                    width: `calc(${progress}% - 0.25rem)`,
                    background: `linear-gradient(90deg, ${gradient})`,
                  }}
                />
                {options.map((option, index) => {
                  const left = maxIndex === 0 ? 0 : (index / maxIndex) * 100;
                  const active = index <= selectedIndex;

                  return (
                    <span
                      key={option.value}
                      className={cn(
                        "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background transition",
                        active
                          ? "border-[var(--model-selector-accent)]"
                          : "border-border",
                      )}
                      style={{ left: `${left}%` }}
                    />
                  );
                })}
                <span
                  className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-lg transition-[left,background-color] duration-200"
                  style={{
                    left: `${progress}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </div>
            <div className="p-1.5" role="listbox">
              {options.map((option, index) => {
                const selected = index === selectedIndex;

                return (
                  <button
                    key={option.value}
                    aria-selected={selected}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-2 text-start outline-none transition-colors",
                      selected && "bg-accent text-accent-foreground",
                      option.disabled
                        ? "pointer-events-none opacity-48"
                        : "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                    )}
                    disabled={option.disabled}
                    onClick={() => {
                      commitIndex(index);
                      setOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: option.color ?? accentColor }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block truncate text-muted-foreground text-xs">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {selected && <CheckIcon className="size-4 shrink-0" />}
                    {option.value === "ultra" && !selected && (
                      <SparklesIcon className="size-4 shrink-0 text-fuchsia-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  );
});
