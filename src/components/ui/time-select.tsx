"use client";

import { ClockIcon } from "lucide-react";
import * as React from "react";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateTimeSelectOptions } from "@/components/ui/time-select-options";

export type TimeSelectProps = {
  value?: string | null;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  start?: string;
  end?: string;
  step?: string;
  minTime?: string;
  maxTime?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  popupClassName?: string;
};

export function TimeSelect({
  value,
  defaultValue,
  onChange,
  start = "09:00",
  end = "18:00",
  step = "00:30",
  minTime,
  maxTime,
  placeholder,
  ariaLabel,
  disabled = false,
  clearable = true,
  className,
  popupClassName,
}: TimeSelectProps): React.ReactElement {
  const t = useEasyT();
  const [internalValue, setInternalValue] = React.useState<
    string | undefined
  >(defaultValue);
  const options = React.useMemo(
    () =>
      generateTimeSelectOptions({ start, end, step, minTime, maxTime }),
    [end, maxTime, minTime, start, step],
  );
  const currentValue = value !== undefined ? value : internalValue;
  const selectableValue = options.some(
    (option) => option.value === currentValue && !option.disabled,
  )
    ? currentValue
    : null;

  const handleValueChange = React.useCallback(
    (nextValue: string | null) => {
      const normalized = nextValue ?? undefined;
      if (value === undefined) setInternalValue(normalized);
      onChange?.(normalized);
    },
    [onChange, value],
  );

  return (
    <Select<string>
      clearable={clearable}
      disabled={disabled}
      key={`${start}-${end}-${step}-${minTime ?? ""}-${maxTime ?? ""}`}
      onValueChange={handleValueChange}
      value={selectableValue}
    >
      <SelectTrigger
        aria-label={
          ariaLabel ?? placeholder ?? t("datePicker.placeholderTime")
        }
        className={cn("w-56", className)}
      >
        <ClockIcon aria-hidden="true" className="size-4" />
        <SelectValue
          placeholder={placeholder ?? t("datePicker.placeholderTime")}
        />
      </SelectTrigger>
      <SelectPopup className={cn("max-h-64", popupClassName)}>
        {options.length > 0 ? (
          options.map((option) => (
            <SelectItem
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.value}
            </SelectItem>
          ))
        ) : (
          <div
            className="px-3 py-6 text-center text-sm text-muted-foreground"
            role="status"
          >
            {t("empty.description")}
          </div>
        )}
      </SelectPopup>
    </Select>
  );
}
