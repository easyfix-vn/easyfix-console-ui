"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ------------------------------------------------------------------ */
/* value → label：从 children 中自动提取 items 映射                       */
/* ------------------------------------------------------------------ */

function extractSelectItems(
  children: React.ReactNode,
): Record<string, React.ReactNode> | undefined {
  const items: Record<string, React.ReactNode> = {};
  let found = false;

  function walk(node: React.ReactNode): void {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === SelectItem) {
        const { value, children: label } = child.props as {
          value?: unknown;
          children?: React.ReactNode;
        };
        if (value != null) {
          items[String(value)] = label ?? null;
          found = true;
        }
        return;
      }
      const childProps = child.props as { children?: React.ReactNode };
      if (childProps.children) {
        walk(childProps.children);
      }
    });
  }

  walk(children);
  return found ? items : undefined;
}

type SelectRootProps<Value, Multiple extends boolean | undefined = false> =
  SelectPrimitive.Root.Props<Value, Multiple>;

type SelectValue<Value, Multiple extends boolean | undefined> =
  SelectRootProps<Value, Multiple>["value"];

type SelectContextValue = {
  clearable: boolean;
  disabled: boolean;
  hasValue: boolean;
  onClear: (event: React.MouseEvent<HTMLSpanElement>) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

export type SelectProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> = SelectRootProps<Value, Multiple> & {
  clearable?: boolean;
};

export function Select<
  Value = unknown,
  Multiple extends boolean | undefined = false,
>({
  items: itemsProp,
  children,
  clearable = true,
  value: valueProp,
  defaultValue,
  multiple,
  disabled = false,
  onValueChange,
  ...props
}: SelectProps<Value, Multiple>): React.ReactElement {
  const resolvedItems = React.useMemo(
    () => itemsProp ?? extractSelectItems(children),
    [itemsProp, children],
  );
  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = React.useState<SelectValue<
    Value,
    Multiple
  >>(valueProp ?? defaultValue ?? null);
  const currentValue = isControlled ? valueProp : internalValue;

  React.useEffect(() => {
    if (isControlled) {
      setInternalValue(valueProp);
    }
  }, [isControlled, valueProp]);

  const handleValueChange: NonNullable<
    SelectRootProps<Value, Multiple>["onValueChange"]
  > = React.useCallback(
    (nextValue, eventDetails) => {
      setInternalValue(nextValue);
      onValueChange?.(nextValue, eventDetails);
    },
    [onValueChange],
  );

  const handleClear = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const nextValue = (multiple ? [] : null) as Parameters<
        NonNullable<SelectRootProps<Value, Multiple>["onValueChange"]>
      >[0];
      setInternalValue(nextValue);
      onValueChange?.(
        nextValue,
        {
          reason: "none",
          event: event.nativeEvent,
          cancel: () => undefined,
          allowPropagation: () => undefined,
          isCanceled: false,
          isPropagationAllowed: false,
          trigger: event.currentTarget,
        } as Parameters<
          NonNullable<SelectRootProps<Value, Multiple>["onValueChange"]>
        >[1],
      );
    },
    [multiple, onValueChange],
  );

  const hasValue = Array.isArray(currentValue)
    ? currentValue.length > 0
    : currentValue != null;

  return (
    <SelectContext.Provider
      value={{ clearable, disabled, hasValue, onClear: handleClear }}
    >
      <SelectPrimitive.Root
        items={resolvedItems}
        multiple={multiple}
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  );
}

export const selectTriggerVariants = cva(
  "relative inline-flex min-h-9 w-full min-w-36 select-none items-center justify-between gap-2 rounded-lg border border-input bg-background not-dark:bg-clip-padding px-[calc(--spacing(3)-1px)] text-left text-base text-foreground shadow-xs/5 outline-none ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 data-disabled:pointer-events-none data-disabled:opacity-64 sm:min-h-8 sm:text-sm dark:bg-input/32 dark:aria-invalid:ring-destructive/24 dark:not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [[data-disabled],:focus-visible,[aria-invalid],[data-pressed]]:shadow-none",
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "",
        lg: "min-h-10 sm:min-h-9",
        sm: "min-h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:min-h-7",
      },
    },
  },
);

export const selectTriggerIconClassName = "-me-1 size-4.5 opacity-80 sm:size-4";

export interface SelectButtonProps extends useRender.ComponentProps<"button"> {
  size?: VariantProps<typeof selectTriggerVariants>["size"];
}

export function SelectButton({
  className,
  size,
  render,
  children,
  ...props
}: SelectButtonProps): React.ReactElement {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button";

  const defaultProps = {
    children: (
      <>
        <span className="flex-1 truncate in-data-placeholder:text-muted-foreground/72">
          {children}
        </span>
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </>
    ),
    className: cn(selectTriggerVariants({ size }), "min-w-0", className),
    "data-slot": "select-button",
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props &
  VariantProps<typeof selectTriggerVariants>): React.ReactElement {
  const selectContext = React.useContext(SelectContext);
  const stopTriggerInteraction = React.useCallback(
    (event: React.SyntheticEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  return (
    <SelectPrimitive.Trigger
      className={cn(selectTriggerVariants({ size }), className)}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      {selectContext?.clearable &&
      selectContext.hasValue &&
      !selectContext.disabled ? (
        <span
          aria-label="清空"
          className="-me-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={selectContext.onClear}
          onMouseDown={stopTriggerInteraction}
          onPointerDown={stopTriggerInteraction}
          role="button"
          tabIndex={-1}
        >
          <XIcon className="size-4" />
        </span>
      ) : (
        <SelectPrimitive.Icon data-slot="select-icon">
          <ChevronsUpDownIcon className={selectTriggerIconClassName} />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue({
  className,
  children,
  ...props
}: SelectPrimitive.Value.Props): React.ReactElement {
  return (
    <SelectPrimitive.Value
      className={cn(
        "flex-1 truncate data-placeholder:text-muted-foreground",
        className,
      )}
      data-slot="select-value"
      {...props}
    >
      {children}
    </SelectPrimitive.Value>
  );
}

export function SelectPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  anchor,
  portalProps,
  ...props
}: SelectPrimitive.Popup.Props & {
  portalProps?: SelectPrimitive.Portal.Props;
  side?: SelectPrimitive.Positioner.Props["side"];
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"];
  align?: SelectPrimitive.Positioner.Props["align"];
  alignOffset?: SelectPrimitive.Positioner.Props["alignOffset"];
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"];
  anchor?: SelectPrimitive.Positioner.Props["anchor"];
}): React.ReactElement {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50 select-none"
        data-slot="select-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className="origin-(--transform-origin) text-foreground outline-none"
          data-slot="select-popup"
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow
            className="top-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-[200%] before:rounded-t-[calc(var(--radius-lg)-1px)] before:bg-linear-to-b before:from-50% before:from-popover"
            data-slot="select-scroll-up-arrow"
          >
            <ChevronUpIcon className="relative size-4.5 sm:size-4" />
          </SelectPrimitive.ScrollUpArrow>
          <div className="relative h-full min-w-(--anchor-width) rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]">
            <SelectPrimitive.List
              className={cn(
                "max-h-(--available-height) overflow-y-auto p-1",
                className,
              )}
              data-slot="select-list"
            >
              {children}
            </SelectPrimitive.List>
          </div>
          <SelectPrimitive.ScrollDownArrow
            className="bottom-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-[200%] before:rounded-b-[calc(var(--radius-lg)-1px)] before:bg-linear-to-t before:from-50% before:from-popover"
            data-slot="select-scroll-down-arrow"
          >
            <ChevronDownIcon className="relative size-4.5 sm:size-4" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  label,
  value,
  ...props
}: SelectPrimitive.Item.Props): React.ReactElement {
  const inferredLabel =
    label ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined);

  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        "grid min-h-8 in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] cursor-default grid-cols-[1rem_1fr] items-center gap-2 whitespace-nowrap rounded-sm py-1 ps-2 pe-4 text-base outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-64 sm:min-h-7 sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="select-item"
      label={inferredLabel}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="col-start-1">
        <svg
          aria-hidden="true"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className="col-start-2 min-w-0">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props): React.ReactElement {
  return (
    <SelectPrimitive.Separator
      className={cn("mx-2 my-1 h-px bg-border", className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

export function SelectGroup(
  props: SelectPrimitive.Group.Props,
): React.ReactElement {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectLabel({
  className,
  ...props
}: SelectPrimitive.Label.Props): React.ReactElement {
  return (
    <SelectPrimitive.Label
      className={cn(
        "not-in-data-[slot=field]:mb-2 inline-flex cursor-default items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4",
        className,
      )}
      data-slot="select-label"
      {...props}
    />
  );
}

export function SelectGroupLabel(
  props: SelectPrimitive.GroupLabel.Props,
): React.ReactElement {
  return (
    <SelectPrimitive.GroupLabel
      className="px-2 py-1.5 font-medium text-muted-foreground text-xs"
      data-slot="select-group-label"
      {...props}
    />
  );
}

export type SelectOption<Value extends string = string> = {
  value: Value;
  label: React.ReactNode;
  disabled?: boolean;
  searchText?: string;
  keywords?: string[];
  group?: string;
};

export type SearchableSelectFilter<Value extends string = string> = (
  option: SelectOption<Value>,
  query: string,
) => boolean;

export interface SearchableSelectProps<Value extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: Value | null;
  defaultValue?: Value | null;
  onValueChange?: (value: Value | null, option?: SelectOption<Value>) => void;
  options: SelectOption<Value>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: React.ReactNode;
  filter?: SearchableSelectFilter<Value>;
  disabled?: boolean;
  clearable?: boolean;
  popupClassName?: string;
  size?: VariantProps<typeof selectTriggerVariants>["size"];
  startAddon?: React.ReactNode;
}

function optionToSearchText<Value extends string>(
  option: SelectOption<Value>,
): string {
  return [
    option.value,
    option.searchText,
    typeof option.label === "string" || typeof option.label === "number"
      ? String(option.label)
      : undefined,
    ...(option.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function defaultSearchableSelectFilter<Value extends string>(
  option: SelectOption<Value>,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return optionToSearchText(option).includes(normalizedQuery);
}

export function SearchableSelect<Value extends string = string>({
  value,
  defaultValue = null,
  onValueChange,
  options,
  placeholder = "请选择",
  searchPlaceholder = "搜索...",
  emptyText = "无匹配结果",
  filter = defaultSearchableSelectFilter,
  disabled = false,
  clearable = true,
  popupClassName,
  size = "default",
  startAddon,
  className,
  ...props
}: SearchableSelectProps<Value>): React.ReactElement {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<Value | null>(
    defaultValue,
  );
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const currentValue = isControlled ? value : internalValue;
  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === currentValue),
    [currentValue, options],
  );
  const filteredOptions = React.useMemo(
    () => options.filter((option) => filter(option, query)),
    [filter, options, query],
  );
  const groupedOptions = React.useMemo(() => {
    const groups = new Map<string, SelectOption<Value>[]>();

    filteredOptions.forEach((option) => {
      const group = option.group ?? "";
      groups.set(group, [...(groups.get(group) ?? []), option]);
    });

    return Array.from(groups.entries());
  }, [filteredOptions]);

  const commitValue = React.useCallback(
    (nextValue: Value | null, option?: SelectOption<Value>) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, option);
    },
    [isControlled, onValueChange],
  );

  return (
    <div className={cn("w-full", className)} data-slot="searchable-select" {...props}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <PopoverTrigger
          disabled={disabled}
          render={
            <button
              className={cn(
                selectTriggerVariants({ size }),
                "min-w-0",
                !selectedOption && "text-muted-foreground",
              )}
              type="button"
            />
          }
        >
          {startAddon && <span className="-ms-0.5 opacity-80">{startAddon}</span>}
          <span className="min-w-0 flex-1 truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          {clearable && currentValue && !disabled ? (
            <span
              aria-label="清空"
              className="-me-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                commitValue(null);
              }}
              role="button"
              tabIndex={-1}
            >
              <XIcon className="size-4" />
            </span>
          ) : (
            <ChevronsUpDownIcon className={selectTriggerIconClassName} />
          )}
        </PopoverTrigger>
        <PopoverPopup
          align="start"
          className={cn("w-(--anchor-width) min-w-56 p-0", popupClassName)}
          viewportClassName="p-0 [--viewport-inline-padding:0px]"
        >
          <div className="sticky top-0 z-10 border-b bg-popover p-2">
            <Input
              inputClassName="!ps-2"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              size="sm"
              value={query}
            />
          </div>
          <ScrollArea
            className="h-72 max-h-[calc(100vh-12rem)] overflow-hidden"
            scrollbarGutter
            scrollFade
          >
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                  {emptyText}
                </div>
              ) : (
                groupedOptions.map(([group, groupOptions]) => (
                  <div key={group || "__default"} className="[[data-slot=select-search-group]+&]:mt-1.5" data-slot="select-search-group">
                    {group && (
                      <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                        {group}
                      </div>
                    )}
                    {groupOptions.map((option) => {
                      const selected = option.value === currentValue;
                      return (
                        <button
                          key={option.value}
                          className={cn(
                            "grid min-h-8 w-full cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-start text-base outline-none transition-colors sm:min-h-7 sm:text-sm",
                            option.disabled
                              ? "pointer-events-none opacity-64"
                              : "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                          )}
                          disabled={option.disabled}
                          onClick={() => {
                            commitValue(option.value, option);
                            setOpen(false);
                            setQuery("");
                          }}
                          type="button"
                        >
                          <span className="col-start-1">
                            {selected && <CheckIcon className="size-4" />}
                          </span>
                          <span className="col-start-2 min-w-0 truncate">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverPopup>
      </Popover>
    </div>
  );
}

export type CascaderOption<Value extends string = string> = {
  value: Value;
  label: React.ReactNode;
  disabled?: boolean;
  children?: CascaderOption<Value>[];
};

export interface CascaderProps<Value extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: Value[];
  defaultValue?: Value[];
  onValueChange?: (
    value: Value[],
    selectedOptions: CascaderOption<Value>[],
  ) => void;
  options: CascaderOption<Value>[];
  placeholder?: string;
  separator?: React.ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  changeOnSelect?: boolean;
  size?: VariantProps<typeof selectTriggerVariants>["size"];
}

function findCascaderPath<Value extends string>(
  options: CascaderOption<Value>[],
  path: Value[] | undefined,
): CascaderOption<Value>[] {
  if (!path?.length) {
    return [];
  }

  const result: CascaderOption<Value>[] = [];
  let currentOptions = options;

  for (const value of path) {
    const option = currentOptions.find((item) => item.value === value);
    if (!option) {
      break;
    }
    result.push(option);
    currentOptions = option.children ?? [];
  }

  return result;
}

export function Cascader<Value extends string = string>({
  value,
  defaultValue = [],
  onValueChange,
  options,
  placeholder = "请选择",
  separator = " / ",
  disabled = false,
  clearable = true,
  changeOnSelect = false,
  size = "default",
  className,
  ...props
}: CascaderProps<Value>): React.ReactElement {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<Value[]>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const currentValue = isControlled ? value : internalValue;
  const selectedOptions = React.useMemo(
    () => findCascaderPath(options, currentValue),
    [currentValue, options],
  );
  const [activePath, setActivePath] = React.useState<Value[]>(currentValue ?? []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setActivePath(currentValue ?? []);
      }
      setOpen(nextOpen);
    },
    [currentValue],
  );

  const activeOptions = React.useMemo(
    () => findCascaderPath(options, activePath),
    [activePath, options],
  );
  const columns = React.useMemo(() => {
    const nextColumns: CascaderOption<Value>[][] = [options];

    activeOptions.forEach((option) => {
      if (option.children?.length) {
        nextColumns.push(option.children);
      }
    });

    return nextColumns;
  }, [activeOptions, options]);

  const commitValue = React.useCallback(
    (nextValue: Value[], nextOptions: CascaderOption<Value>[]) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, nextOptions);
    },
    [isControlled, onValueChange],
  );
  const handleClear = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setActivePath([]);
      commitValue([], []);
      setOpen(false);
    },
    [commitValue],
  );

  return (
    <div className={cn("w-full", className)} data-slot="cascader" {...props}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <button
              className={cn(
                selectTriggerVariants({ size }),
                "min-w-0",
                selectedOptions.length === 0 && "text-muted-foreground",
              )}
              type="button"
            />
          }
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedOptions.length > 0
              ? selectedOptions.map((option, index) => (
                  <React.Fragment key={option.value}>
                    {index > 0 && (
                      <span className="mx-1 text-muted-foreground">
                        {separator}
                      </span>
                    )}
                    <span>{option.label}</span>
                  </React.Fragment>
                ))
              : placeholder}
          </span>
          {clearable && selectedOptions.length > 0 && !disabled ? (
            <span
              aria-label="清空"
              className="-me-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={handleClear}
              role="button"
              tabIndex={-1}
            >
              <XIcon className="size-4" />
            </span>
          ) : (
            <ChevronsUpDownIcon className={selectTriggerIconClassName} />
          )}
        </PopoverTrigger>
        <PopoverPopup
          align="start"
          className="w-max max-w-[calc(100vw-2rem)] overflow-visible p-0"
          viewportClassName="p-0 [--viewport-inline-padding:0px]"
        >
          <div
            className="flex max-h-80 max-w-[calc(100vw-2rem)] overflow-hidden bg-popover"
            data-slot="cascader-panel"
            style={{
              width: `min(calc(100vw - 2rem), ${Math.max(360, columns.length * 192)}px)`,
            }}
          >
            {columns.map((column, columnIndex) => (
              <div
                key={activePath.slice(0, columnIndex).join("/") || "root"}
                className={cn(
                  "min-w-0 flex-1 basis-0",
                  columnIndex > 0 && "border-s border-border",
                )}
                data-slot="cascader-column"
              >
                <ScrollArea className="max-h-80" scrollbarGutter scrollFade>
                  <div className="p-1">
                    {column.length === 0 ? (
                      <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                        暂无选项
                      </div>
                    ) : (
                      column.map((option) => {
                        const selected = activePath[columnIndex] === option.value;
                        const nextPath = [
                          ...activePath.slice(0, columnIndex),
                          option.value,
                        ];
                        const nextOptions = findCascaderPath(options, nextPath);
                        const hasChildren = Boolean(option.children?.length);

                        return (
                          <button
                            key={option.value}
                            className={cn(
                              "group flex min-h-8 w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1 text-start text-base outline-none transition-colors sm:min-h-7 sm:text-sm",
                              selected && "bg-accent text-accent-foreground",
                              option.disabled
                                ? "pointer-events-none opacity-64"
                                : "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                            )}
                            disabled={option.disabled}
                            onFocus={() => {
                              setActivePath(nextPath);
                            }}
                            onMouseEnter={() => {
                              setActivePath(nextPath);
                            }}
                            onClick={() => {
                              setActivePath(nextPath);
                              if (changeOnSelect || !hasChildren) {
                                commitValue(nextPath, nextOptions);
                              }
                              if (!hasChildren) {
                                setOpen(false);
                              }
                            }}
                            type="button"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {option.label}
                            </span>
                            {hasChildren ? (
                              <ChevronRightIcon className="size-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
                            ) : selected ? (
                              <CheckIcon className="size-4" />
                            ) : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  );
}

export { SelectPrimitive, SelectPopup as SelectContent };
