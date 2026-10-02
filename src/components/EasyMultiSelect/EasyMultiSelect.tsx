"use client";

import { CheckIcon, ChevronDownIcon, Loader2Icon, XIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";

export type EasyMultiSelectOption = {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
};

export interface EasyMultiSelectProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  value: string[];
  onChange: (value: string[]) => void;
  options: EasyMultiSelectOption[];
  onSearch?: (keyword: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxCount?: number;
  renderOption?: (
    option: EasyMultiSelectOption,
    state: { selected: boolean },
  ) => React.ReactNode;
  emptyText?: React.ReactNode;
  loading?: boolean;
  searchPlaceholder?: string;
  name?: string;
}

function optionText(option: EasyMultiSelectOption): string {
  return typeof option.label === "string" || typeof option.label === "number"
    ? String(option.label)
    : option.value;
}

export function EasyMultiSelect({
  value,
  onChange,
  options,
  onSearch,
  placeholder,
  disabled = false,
  maxCount,
  renderOption,
  emptyText,
  loading = false,
  searchPlaceholder,
  name,
  className,
  ...props
}: EasyMultiSelectProps): React.ReactElement {
  const t = useEasyT();
  const [open, setOpen] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const selectedSet = React.useMemo(() => new Set(value), [value]);
  const optionMap = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );
  const selectedOptions = value.map(
    (item) => optionMap.get(item) ?? { value: item, label: item },
  );
  const visibleSelected =
    maxCount && maxCount > 0 ? selectedOptions.slice(0, maxCount) : selectedOptions;
  const foldedCount = Math.max(0, selectedOptions.length - visibleSelected.length);
  const filteredOptions = React.useMemo(() => {
    if (onSearch || !keyword.trim()) return options;
    const lowerKeyword = keyword.trim().toLowerCase();
    return options.filter((option) =>
      [option.value, optionText(option), option.description]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(lowerKeyword)),
    );
  }, [keyword, onSearch, options]);
  const enabledOptions = filteredOptions.filter((option) => !option.disabled);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [keyword, filteredOptions.length]);

  function updateKeyword(next: string): void {
    setKeyword(next);
    onSearch?.(next);
  }

  function toggleOption(optionValue: string): void {
    const next = selectedSet.has(optionValue)
      ? value.filter((item) => item !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  function removeOption(optionValue: string, event?: React.MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    onChange(value.filter((item) => item !== optionValue));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    if (!open && ["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, enabledOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      const option = enabledOptions[activeIndex];
      if (option) {
        event.preventDefault();
        toggleOption(option.value);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && !keyword && value.length) {
      removeOption(value[value.length - 1]);
    }
  }

  return (
    <div {...props} className={cn("w-full", className)} data-slot="easy-multi-select">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <button
              aria-expanded={open}
              aria-label={placeholder ?? t("multiSelect.placeholder")}
              className={cn(
                "flex min-h-9 w-full items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 text-start text-sm shadow-xs/5 outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 disabled:cursor-not-allowed disabled:opacity-64",
                !value.length && "text-muted-foreground",
              )}
              onKeyDown={handleKeyDown}
              type="button"
            />
          }
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {visibleSelected.length ? (
              visibleSelected.map((option) => (
                <Badge key={option.value} size="lg" variant="outline">
                  <span className="max-w-36 truncate">{option.label}</span>
                  {!disabled && (
                    <span
                      aria-label={t("multiSelect.removeOption", {
                        label: optionText(option),
                      })}
                      className="-me-1 inline-flex size-4 items-center justify-center rounded-sm hover:bg-accent"
                      onClick={(event) => removeOption(option.value, event)}
                      role="button"
                    >
                      <XIcon className="size-3" />
                    </span>
                  )}
                </Badge>
              ))
            ) : (
              <span className="px-1">{placeholder ?? t("multiSelect.placeholder")}</span>
            )}
            {foldedCount > 0 && (
              <Badge size="lg" variant="secondary">+{foldedCount}</Badge>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverPopup align="start" className="w-(--anchor-width) p-0" viewportClassName="!p-0 [--viewport-inline-padding:0px]">
          <div onKeyDown={handleKeyDown}>
            <div className="px-2.5 py-1.5">
              <Input
                autoFocus
                value={keyword}
                onChange={(event) => updateKeyword(event.target.value)}
                placeholder={searchPlaceholder ?? t("multiSelect.searchPlaceholder")}
              />
            </div>
            <ScrollArea scrollbarGutter scrollFade>
              <div className="max-h-72 p-1">
                {loading && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    {t("multiSelect.loading")}
                  </div>
                )}
                {!loading && filteredOptions.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {emptyText ?? t("multiSelect.empty")}
                  </div>
                )}
                {filteredOptions.map((option) => {
                  const selected = selectedSet.has(option.value);
                  const active = enabledOptions[activeIndex]?.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      data-active={active || undefined}
                      className="flex min-h-8 w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1 text-start text-sm outline-none data-[active=true]:bg-accent disabled:pointer-events-none disabled:opacity-64"
                      onClick={() => !option.disabled && toggleOption(option.value)}
                    >
                      <span className="grid size-4 place-items-center text-primary">
                        {selected && <CheckIcon className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        {renderOption ? (
                          renderOption(option, { selected })
                        ) : (
                          <span className="flex flex-col">
                            <span className="truncate">{option.label}</span>
                            {option.description && (
                              <span className="truncate text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </PopoverPopup>
      </Popover>
      {name && value.map((item) => <input key={item} type="hidden" name={name} value={item} />)}
    </div>
  );
}
