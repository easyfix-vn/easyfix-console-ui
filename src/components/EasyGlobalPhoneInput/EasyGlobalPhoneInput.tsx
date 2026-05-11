"use client";

import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CC_OPTIONS,
  buildValidator,
  type CountryCodeOption,
} from "./presets";

export interface EasyGlobalPhoneInputProps {
  cc: string;
  phone: string;
  onCcChange: (cc: string) => void;
  onPhoneChange: (phone: string) => void;
  /** 自定义区号选项，不传则使用内置 84/86 */
  options?: CountryCodeOption[];
  /** 按区号覆盖/扩展验证函数，返回错误信息字符串或 undefined */
  validators?: Record<string, (phone: string) => string | undefined>;
  /** 是否可清除号码，默认 true */
  allowClear?: boolean;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  placeholder?: string;
  /** 外部传入的错误信息（优先级高于内置验证） */
  error?: string;
  className?: string;
}

export const EasyGlobalPhoneInput = React.forwardRef<
  HTMLInputElement,
  EasyGlobalPhoneInputProps
>(function EasyGlobalPhoneInput(
  {
    cc,
    phone,
    onCcChange,
    onPhoneChange,
    options,
    validators,
    allowClear = true,
    disabled = false,
    size = "default",
    placeholder,
    error: errorProp,
    className,
  },
  ref,
) {
  const t = useEasyT();
  const resolvedOptions = options ?? DEFAULT_CC_OPTIONS;
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const currentOption = resolvedOptions.find((o) => o.cc === cc);

  const internalError = React.useMemo(() => {
    if (!phone || !currentOption) return undefined;

    if (validators?.[cc]) {
      return validators[cc](phone);
    }

    const result = buildValidator(currentOption)(phone);
    if (!result) return undefined;
    if (typeof result === "string") return result;
    return t(result.key, result.params);
  }, [cc, phone, currentOption, validators, t]);

  const displayError = errorProp ?? internalError;
  const resolvedPlaceholder = placeholder ?? t("globalPhone.placeholder");

  const handleClear = React.useCallback(() => {
    onPhoneChange("");
    inputRef.current?.focus();
  }, [onPhoneChange]);

  const showClearBtn = allowClear && !disabled && phone.length > 0;

  return (
    <div className={cn("inline-flex w-full flex-col gap-1", className)}>
      <div
        className={cn(
          "relative inline-flex w-full items-center rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] sm:text-sm dark:bg-input/32",
          !disabled &&
            "has-focus-visible:border-ring has-focus-visible:ring-[3px]",
          !disabled &&
            "not-has-focus-visible:before:shadow-[0_1px_--theme(--color-black/4%)] dark:not-has-focus-visible:before:shadow-[0_-1px_--theme(--color-white/6%)]",
          disabled && "opacity-64",
          displayError && "border-destructive/36",
        )}
        data-slot="global-phone-input"
      >
        <Select
          value={cc}
          onValueChange={(val) => onCcChange(val as string)}
          disabled={disabled}
        >
          <SelectTrigger
            size={size}
            className="min-w-0 w-auto shrink-0 border-0 bg-transparent shadow-none ring-0 before:hidden focus-visible:border-0 focus-visible:ring-0"
          >
            <SelectValue placeholder="+--" />
          </SelectTrigger>
          <SelectPopup>
            {resolvedOptions.map((opt) => (
              <SelectItem key={opt.cc} value={opt.cc}>
                <span className="inline-flex items-center gap-2">
                  {opt.flag && (
                    <span
                      className={cn(
                        "fi inline-block size-4 rounded-sm",
                        `fi-${opt.flag}`,
                      )}
                    />
                  )}
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <div className="mx-0 h-5 w-px shrink-0 bg-input" />
        <Input
          ref={inputRef}
          size={size}
          unstyled
          nativeInput
          className="flex-1"
          value={phone}
          onChange={(e) => onPhoneChange((e.target as HTMLInputElement).value)}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
        />
        {showClearBtn && (
          <button
            type="button"
            aria-label="Clear"
            className="me-2 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/72 outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleClear}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
    </div>
  );
});
