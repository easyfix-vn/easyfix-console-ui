"use client";

import { XIcon } from "lucide-react";
import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BaseInputAttrs = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "size"
>;

export type EasyInputProps = BaseInputAttrs & {
  /** 输入框尺寸（透传给底层 Input） */
  size?: InputProps["size"];
  /** 前置插槽：渲染在输入框左侧（如图标、文字） */
  prefix?: React.ReactNode;
  /** 后置插槽：渲染在输入框右侧（如图标、单位、按钮） */
  suffix?: React.ReactNode;
  /** 是否可清除：在有内容时显示清除按钮 */
  allowClear?: boolean;
  /** 字数限制：限制输入字数；与 showCount 配合显示当前字数 */
  maxLength?: number;
  /** 是否显示字数（"x / max" 格式） */
  showCount?: boolean;
  /** 清除/输入清空时的回调 */
  onClear?: () => void;
  /** 容器额外类名 */
  wrapperClassName?: string;
};

/**
 * 文本输入框增强版：
 * - 支持 prefix / suffix 插槽
 * - 支持 allowClear 一键清除
 * - 支持 maxLength + showCount 字数限制与字数提示
 *
 * 使用 InputGroup 风格的容器，将 native input 嵌入并保留对齐与焦点表现。
 */
export const EasyInput = React.forwardRef<HTMLInputElement, EasyInputProps>(
  function EasyInput(
    {
      className,
      wrapperClassName,
      prefix,
      suffix,
      allowClear = false,
      maxLength,
      showCount = false,
      onClear,
      onChange,
      value: valueProp,
      defaultValue,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) {
    const isControlled = valueProp !== undefined;
    const [innerValue, setInnerValue] = React.useState<string>(
      defaultValue != null ? String(defaultValue) : "",
    );
    const value = isControlled ? String(valueProp ?? "") : innerValue;

    const innerRef = React.useRef<HTMLInputElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
          setInnerValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange],
    );

    const handleClear = React.useCallback(() => {
      const input = innerRef.current;
      if (input) {
        // 通过原生 setter 触发 React onChange，确保受控/非受控均生效
        const setter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(input),
          "value",
        )?.set;
        setter?.call(input, "");
        const ev = new Event("input", { bubbles: true });
        input.dispatchEvent(ev);
        input.focus();
      }
      if (!isControlled) {
        setInnerValue("");
      }
      onClear?.();
    }, [isControlled, onClear]);

    const showClearBtn =
      allowClear && !disabled && !readOnly && value.length > 0;
    const hasSuffixArea = Boolean(suffix) || showClearBtn || showCount;

    return (
      <span
        className={cn(
          "relative inline-flex w-full min-w-0 items-center rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-[input:disabled]:not-has-[input:focus-visible]:not-has-[input[aria-invalid]]:before:shadow-[0_1px_--theme(--color-black/4%)] has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input[aria-invalid]]:border-destructive/36 has-[input:disabled]:opacity-64 sm:text-sm dark:bg-input/32 dark:not-has-[input:disabled]:not-has-[input:focus-visible]:not-has-[input[aria-invalid]]:before:shadow-[0_-1px_--theme(--color-white/6%)]",
          wrapperClassName,
        )}
        data-slot="easy-input"
      >
        {prefix && (
          <span
            className="flex shrink-0 items-center gap-1.5 ps-3 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0"
            data-slot="easy-input-prefix"
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).tagName !== "INPUT") {
                e.preventDefault();
                innerRef.current?.focus();
              }
            }}
          >
            {prefix}
          </span>
        )}
        <Input
          ref={innerRef}
          unstyled
          nativeInput
          className={cn("flex-1", className)}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          {...props}
        />
        {hasSuffixArea && (
          <span
            className="flex shrink-0 items-center gap-1 pe-2.5 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0"
            data-slot="easy-input-suffix"
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.tagName !== "BUTTON" &&
                target.tagName !== "INPUT" &&
                !target.closest("button,a,input")
              ) {
                e.preventDefault();
                innerRef.current?.focus();
              }
            }}
          >
            {showClearBtn && (
              <button
                type="button"
                aria-label="Clear"
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground/72 outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={handleClear}
              >
                <XIcon className="size-3.5" />
              </button>
            )}
            {showCount && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {value.length}
                {maxLength != null ? ` / ${maxLength}` : ""}
              </span>
            )}
            {suffix}
          </span>
        )}
      </span>
    );
  },
);
