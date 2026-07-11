"use client";

import * as React from "react";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EasyPriceText } from "@/components/EasyPriceText";
import {
  DEFAULT_PRICE_CURRENCY_OPTIONS,
  formatPriceInputValue,
  getCurrencyFractionDigits,
  getPriceCurrencyOption,
  getPriceUnitText,
  normalizeCurrencyCode,
  normalizePriceValue,
  parsePriceValue,
  sanitizePriceInput,
  type EasyCurrencyCode,
  type EasyPriceCurrencyOption,
  type EasyPriceSize,
  type EasyPriceUnitPosition,
  type EasyPriceValue,
} from "@/components/EasyPriceText";

export type EasyPriceInputDisplayVariant = "default" | "tag";

export interface EasyPriceInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: EasyPriceValue;
  onValueChange: (value: string) => void;
  /** ISO 4217 三字母货币代码，如 VND、USD、CNY。默认 VND */
  currency?: EasyCurrencyCode;
  onCurrencyChange?: (currency: EasyCurrencyCode) => void;
  currencyOptions?: EasyPriceCurrencyOption[];
  /** 是否启用千分位，默认 true */
  useGrouping?: boolean;
  /** 千分位分隔符，默认 "," */
  groupSeparator?: string;
  /** 小数分隔符，默认 "." */
  decimalSeparator?: string;
  /** 货币单位文本，不传时默认使用 currency */
  unitText?: string;
  /** 货币单位位置，默认 suffix */
  unitPosition?: EasyPriceUnitPosition;
  /** 小数位数；不传时按常见 ISO 4217 minor unit 推断 */
  precision?: number;
  /** 最小输入值，默认空，不限制 */
  min?: EasyPriceValue;
  /** 最大输入值，默认空，不限制 */
  max?: EasyPriceValue;
  size?: EasyPriceSize;
  /** 回显展示样式，默认 default */
  displayVariant?: EasyPriceInputDisplayVariant;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  editLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

function getResolvedPrecision(
  currency: EasyCurrencyCode,
  precision: number | undefined,
  options: EasyPriceCurrencyOption[],
): number {
  const option = getPriceCurrencyOption(currency, options);
  return getCurrencyFractionDigits(currency, precision ?? option?.fractionDigits);
}

const displaySizeClassNames: Record<EasyPriceSize, string> = {
  sm: "min-h-7.5 px-2 py-1 text-sm sm:min-h-6.5 sm:text-xs",
  default: "min-h-8.5 px-3 py-1.5 text-base sm:min-h-7.5 sm:text-sm",
  lg: "min-h-9.5 px-3.5 py-2 text-base sm:min-h-8.5 sm:text-sm",
};

const displayVariantClassNames: Record<EasyPriceInputDisplayVariant, string> = {
  default:
    "rounded-lg border-input bg-background text-foreground shadow-xs/5 dark:bg-input/32",
  tag: "rounded-full border-transparent bg-muted/72 text-foreground shadow-none dark:bg-muted/36",
};

const displayVariantInteractiveClassNames: Record<
  EasyPriceInputDisplayVariant,
  string
> = {
  default: "cursor-pointer hover:border-ring/60 hover:bg-accent/35",
  tag: "cursor-pointer hover:border-border hover:bg-accent/70",
};

export const EasyPriceInput = React.forwardRef<HTMLDivElement, EasyPriceInputProps>(
  function EasyPriceInput(
    {
      value,
      onValueChange,
      currency = "VND",
      onCurrencyChange,
      currencyOptions = DEFAULT_PRICE_CURRENCY_OPTIONS,
      useGrouping = true,
      groupSeparator = ",",
      decimalSeparator = ".",
      unitText,
      unitPosition = "suffix",
      precision,
      min,
      max,
      size = "default",
      displayVariant = "default",
      placeholder,
      disabled = false,
      error: errorProp,
      editLabel = "编辑金额",
      confirmLabel = "确认金额",
      cancelLabel = "取消编辑",
      className,
      ...props
    },
    ref,
  ) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = React.useState(false);
    const [draftCurrency, setDraftCurrency] = React.useState<EasyCurrencyCode>(
      normalizeCurrencyCode(currency),
    );
    const [draftText, setDraftText] = React.useState("");
    const [internalError, setInternalError] = React.useState<string>();

    const displayCurrency = normalizeCurrencyCode(currency);
    const resolvedPrecision = React.useMemo(
      () => getResolvedPrecision(displayCurrency, precision, currencyOptions),
      [displayCurrency, precision, currencyOptions],
    );
    const draftPrecision = React.useMemo(
      () => getResolvedPrecision(draftCurrency, precision, currencyOptions),
      [draftCurrency, precision, currencyOptions],
    );
    const resolvedUnitText = getPriceUnitText(
      draftCurrency,
      unitText,
      currencyOptions,
    );
    const canChangeCurrency = currencyOptions.length > 0 && Boolean(onCurrencyChange);
    const displayError = errorProp ?? internalError;

    const resetDraft = React.useCallback(() => {
      setDraftCurrency(displayCurrency);
      setDraftText(
        formatPriceInputValue(String(value ?? ""), {
          precision: resolvedPrecision,
          useGrouping,
          groupSeparator,
          decimalSeparator,
        }),
      );
      setInternalError(undefined);
    }, [
      displayCurrency,
      value,
      resolvedPrecision,
      useGrouping,
      groupSeparator,
      decimalSeparator,
    ]);

    React.useEffect(() => {
      if (!editing) {
        resetDraft();
      }
    }, [editing, resetDraft]);

    React.useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [editing]);

    const handleEdit = React.useCallback(() => {
      if (disabled) {
        return;
      }
      resetDraft();
      setEditing(true);
    }, [disabled, resetDraft]);

    const handleCancel = React.useCallback(() => {
      resetDraft();
      setEditing(false);
    }, [resetDraft]);

    const handleDraftChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setInternalError(undefined);
        setDraftText(
          formatPriceInputValue(event.target.value, {
            precision: draftPrecision,
            useGrouping,
            groupSeparator,
            decimalSeparator,
          }),
        );
      },
      [draftPrecision, useGrouping, groupSeparator, decimalSeparator],
    );

    const handleDraftCurrencyChange = React.useCallback(
      (nextCurrency: EasyCurrencyCode | null) => {
        if (!nextCurrency) {
          return;
        }

        const normalizedCurrency = normalizeCurrencyCode(nextCurrency);
        const nextPrecision = getResolvedPrecision(
          normalizedCurrency,
          precision,
          currencyOptions,
        );
        setDraftCurrency(normalizedCurrency);
        setDraftText((current) =>
          formatPriceInputValue(current, {
            precision: nextPrecision,
            useGrouping,
            groupSeparator,
            decimalSeparator,
          }),
        );
        setInternalError(undefined);
      },
      [precision, currencyOptions, useGrouping, groupSeparator, decimalSeparator],
    );

    const handleConfirm = React.useCallback(() => {
      const normalizedDraft = sanitizePriceInput(draftText, {
        precision: draftPrecision,
        groupSeparator,
        decimalSeparator,
      });
      const parsed = parsePriceValue(normalizedDraft);

      if (parsed === undefined) {
        onValueChange("");
        onCurrencyChange?.(draftCurrency);
        setInternalError(undefined);
        setEditing(false);
        return;
      }

      const minValue = parsePriceValue(min);
      const maxValue = parsePriceValue(max);

      if (minValue !== undefined && parsed < minValue) {
        setInternalError(`金额不能小于 ${normalizePriceValue(minValue, draftPrecision)}`);
        return;
      }

      if (maxValue !== undefined && parsed > maxValue) {
        setInternalError(`金额不能大于 ${normalizePriceValue(maxValue, draftPrecision)}`);
        return;
      }

      onCurrencyChange?.(draftCurrency);
      onValueChange(normalizePriceValue(parsed, draftPrecision));
      setInternalError(undefined);
      setEditing(false);
    }, [
      draftText,
      draftPrecision,
      groupSeparator,
      decimalSeparator,
      onValueChange,
      onCurrencyChange,
      draftCurrency,
      min,
      max,
    ]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleConfirm();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          handleCancel();
        }
      },
      [handleConfirm, handleCancel],
    );

    const handleDisplayTextKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleEdit();
        }
      },
      [handleEdit],
    );

    const handleDisplayTextClick = React.useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        handleEdit();
      },
      [handleEdit],
    );

    const handleEditButtonClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        handleEdit();
      },
      [handleEdit],
    );

    const currencyControl = resolvedUnitText ? (
      canChangeCurrency ? (
        <Select
          value={draftCurrency}
          onValueChange={handleDraftCurrencyChange}
          disabled={disabled}
        >
          <SelectTrigger
            size={size}
            className="h-auto min-h-0 w-auto min-w-20 shrink-0 self-stretch rounded-none border-0 bg-transparent px-2 text-sm shadow-none ring-0 before:hidden focus-visible:border-0 focus-visible:ring-0 sm:min-h-0"
          >
            <SelectValue placeholder="CUR" />
          </SelectTrigger>
          <SelectPopup>
            {currencyOptions.map((option) => (
              <SelectItem
                key={normalizeCurrencyCode(option.currency)}
                value={normalizeCurrencyCode(option.currency)}
              >
                {option.label ?? normalizeCurrencyCode(option.currency)}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      ) : (
        <span className="inline-flex shrink-0 self-stretch items-center px-3 text-sm font-medium leading-none text-muted-foreground">
          {resolvedUnitText}
        </span>
      )
    ) : null;

    return (
      <div
        ref={ref}
        className={cn("inline-flex w-full flex-col gap-1", className)}
        data-slot="price-input"
        {...props}
      >
        {!editing ? (
          <div
            className={cn(
              "relative inline-flex w-fit max-w-full items-center gap-1.5 border transition-colors",
              displayVariantClassNames[displayVariant],
              !disabled && displayVariantInteractiveClassNames[displayVariant],
              displaySizeClassNames[size],
              disabled && "opacity-64",
              displayError && "border-destructive/36",
            )}
            onClick={disabled ? undefined : handleEdit}
            data-size={size}
            data-slot="price-input-display"
            data-variant={displayVariant}
          >
            <EasyPriceText
              value={value}
              currency={displayCurrency}
              precision={resolvedPrecision}
              useGrouping={useGrouping}
              groupSeparator={groupSeparator}
              decimalSeparator={decimalSeparator}
              unitText={unitText}
              unitPosition={unitPosition}
              className={cn(
                "min-w-0 truncate rounded-md px-0.5 outline-none transition-colors",
                !disabled &&
                  "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring",
              )}
              onClick={disabled ? undefined : handleDisplayTextClick}
              onKeyDown={disabled ? undefined : handleDisplayTextKeyDown}
              role={disabled ? undefined : "button"}
              tabIndex={disabled ? undefined : 0}
            />
            <Button
              aria-label={editLabel}
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={handleEditButtonClick}
              size="icon-xs"
              variant="ghost"
            >
              <PencilIcon />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "relative inline-flex w-full items-center rounded-lg border border-input bg-background text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] sm:text-sm dark:bg-input/32",
              "has-focus-visible:border-ring has-focus-visible:ring-[3px]",
              displayError && "border-destructive/36",
            )}
            data-slot="price-input-editor"
          >
            {unitPosition === "prefix" && currencyControl}
            {unitPosition === "prefix" && currencyControl && (
              <div className="h-5 w-px shrink-0 bg-input" />
            )}
            <Input
              ref={inputRef}
              aria-invalid={Boolean(displayError)}
              className="flex-1"
              disabled={disabled}
              inputMode="decimal"
              nativeInput
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              size={size}
              type="text"
              unstyled
              value={draftText}
            />
            {unitPosition === "suffix" && currencyControl && (
              <div className="h-5 w-px shrink-0 bg-input" />
            )}
            {unitPosition === "suffix" && currencyControl}
            <div className="ms-1 me-1 flex shrink-0 items-center gap-0.5">
              <Button
                aria-label={confirmLabel}
                onClick={handleConfirm}
                size="icon-xs"
                variant="ghost"
              >
                <CheckIcon />
              </Button>
              <Button
                aria-label={cancelLabel}
                onClick={handleCancel}
                size="icon-xs"
                variant="ghost"
              >
                <XIcon />
              </Button>
            </div>
          </div>
        )}
        {displayError && (
          <p className="text-xs text-destructive">{displayError}</p>
        )}
      </div>
    );
  },
);
