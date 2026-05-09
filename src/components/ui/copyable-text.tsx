"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * CopyableText —— 可复制文本区域。
 *
 * 三种视觉变体：
 *  - inline: 文本与复制按钮内联展示，按钮在 hover 时浮现，适合代码片段、ID
 *  - block:  独立条状容器，左文右按钮，适合 token / 链接
 *  - card:   多行 mono 字体卡片，复制按钮悬浮在右上角
 *
 * 支持：自动复制反馈（图标切换 + tooltip）、单行 truncate + Tooltip 显示完整、
 * 自定义按钮 size、可受控 onCopy 回调、降级 execCommand。
 */

async function writeToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 浏览器拒绝了，回退到 execCommand
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

export type CopyableTextVariant = "inline" | "block" | "card";

export type CopyableTextProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onCopy"
> & {
  /** 实际要复制到剪贴板的字符串 */
  value: string;
  /** 显示内容；不传时显示 value */
  children?: React.ReactNode;
  /** 视觉变体，默认 block */
  variant?: CopyableTextVariant;
  /** 复制按钮尺寸，默认随 variant */
  size?: "xs" | "sm" | "md";
  /** 复制成功提示文案 */
  copyTooltip?: string;
  copiedTooltip?: string;
  /** 文本超出容器时单行截断并 hover 时通过 title 提示完整内容 */
  truncate?: boolean;
  /** copied 反馈持续毫秒数，默认 1500 */
  revealMs?: number;
  /** 隐藏复制按钮（用于自定义触发场景） */
  hideButton?: boolean;
  /** 仅渲染复制按钮，不渲染文本本体；常用于嵌入到其它组件（如 DataListValue）旁边 */
  iconOnly?: boolean;
  /** 复制成功后回调 */
  onCopy?: (value: string) => void;
};

const ICON_SIZE: Record<NonNullable<CopyableTextProps["size"]>, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
};

const BUTTON_SIZE_MAP: Record<
  NonNullable<CopyableTextProps["size"]>,
  "xs" | "sm"
> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
};

export const CopyableText = React.forwardRef<HTMLElement, CopyableTextProps>(
  function CopyableText(
    {
      value,
      children,
      variant = "block",
      size,
      copyTooltip = "复制",
      copiedTooltip = "已复制",
      truncate = false,
      revealMs = 1500,
      hideButton = false,
      iconOnly = false,
      onCopy,
      className,
      onClick,
      ...rest
    },
    ref,
  ) {
    const [copied, setCopied] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(
      () => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      },
      [],
    );

    const handleCopy = React.useCallback(
      async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const ok = await writeToClipboard(value);
        if (!ok) return;
        onCopy?.(value);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), revealMs);
      },
      [value, onCopy, revealMs],
    );

    const resolvedSize: NonNullable<CopyableTextProps["size"]> =
      size ?? (variant === "card" ? "md" : variant === "block" ? "sm" : "xs");
    const iconCls = ICON_SIZE[resolvedSize];
    const btnSize = BUTTON_SIZE_MAP[resolvedSize];

    const button = !hideButton && (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size={btnSize}
              variant={variant === "inline" ? "ghost" : "outline"}
              aria-label={copied ? copiedTooltip : copyTooltip}
              className={cn(
                "shrink-0 transition-colors",
                variant === "inline" &&
                  "h-6 px-1.5 text-muted-foreground opacity-0 transition-opacity group-hover/copyable:opacity-100 focus-visible:opacity-100 data-[state=copied]:opacity-100",
                copied && "text-success",
              )}
              data-state={copied ? "copied" : "idle"}
              onClick={handleCopy}
            />
          }
        >
          {copied ? (
            <>
              <CheckIcon className={iconCls} />
              {(variant === "block" || variant === "card") &&
                resolvedSize !== "xs" && (
                  <span className="ms-1">{copiedTooltip}</span>
                )}
            </>
          ) : (
            <>
              <CopyIcon className={iconCls} />
              {variant === "block" && resolvedSize !== "xs" && (
                <span className="ms-1">{copyTooltip}</span>
              )}
            </>
          )}
        </TooltipTrigger>
        <TooltipPopup side="top">
          {copied ? copiedTooltip : copyTooltip}
        </TooltipPopup>
      </Tooltip>
    );

    const display = children ?? value;

    // iconOnly：只渲染按钮（用于嵌入其它组件旁边），始终可见
    if (iconOnly) {
      const iconOnlyButton = !hideButton && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size={btnSize}
                variant="ghost"
                aria-label={copied ? copiedTooltip : copyTooltip}
                className={cn(
                  "shrink-0 text-muted-foreground hover:text-foreground",
                  copied && "text-success hover:text-success",
                )}
                data-state={copied ? "copied" : "idle"}
                onClick={handleCopy}
              />
            }
          >
            {copied ? (
              <CheckIcon className={iconCls} />
            ) : (
              <CopyIcon className={iconCls} />
            )}
          </TooltipTrigger>
          <TooltipPopup side="top">
            {copied ? copiedTooltip : copyTooltip}
          </TooltipPopup>
        </Tooltip>
      );

      return (
        <span
          className={cn(
            "inline-flex shrink-0 items-center align-middle",
            className,
          )}
          data-slot="copyable-text"
          data-variant="icon-only"
        >
          {iconOnlyButton}
        </span>
      );
    }

    if (variant === "inline") {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(
            "group/copyable inline-flex max-w-full items-center gap-1 align-middle",
            className,
          )}
          data-slot="copyable-text"
          data-variant="inline"
          {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
        >
          <span
            className={cn(
              "min-w-0 font-mono text-[0.95em] text-foreground",
              truncate && "block max-w-full truncate",
            )}
            title={truncate ? value : undefined}
          >
            {display}
          </span>
          {button}
        </span>
      );
    }

    if (variant === "card") {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
            "group/copyable relative rounded-lg border bg-muted/40 px-3 py-2.5 text-sm",
            className,
          )}
          data-slot="copyable-text"
          data-variant="card"
          onClick={onClick}
          {...rest}
        >
          <pre
            className={cn(
              "m-0 max-h-72 overflow-auto whitespace-pre-wrap break-all pr-10 font-mono text-foreground",
              truncate && "max-h-12",
            )}
          >
            {display}
          </pre>
          <div className="absolute end-2 top-2 opacity-0 transition-opacity group-hover/copyable:opacity-100 focus-within:opacity-100 data-[state=copied]:opacity-100">
            {button}
          </div>
        </div>
      );
    }

    // variant === "block"
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "group/copyable inline-flex max-w-full items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground",
          className,
        )}
        data-slot="copyable-text"
        data-variant="block"
        onClick={onClick}
        {...rest}
      >
        <span
          className={cn(
            "min-w-0 font-mono",
            truncate && "block flex-1 truncate",
          )}
          title={truncate ? value : undefined}
        >
          {display}
        </span>
        {button}
      </div>
    );
  },
);
