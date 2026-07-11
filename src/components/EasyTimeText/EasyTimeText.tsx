"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatTimeText,
  type EasyTimeTextFormat,
  type EasyTimeTextValue,
} from "./time-format";

export type EasyTimeTextSize = "sm" | "default" | "lg";

export interface EasyTimeTextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value?: EasyTimeTextValue;
  /** IANA 时区或常见缩写，如 Asia/Ho_Chi_Minh、UTC、ICT、CST */
  timeZone?: string;
  /** Intl locale，默认 en-CA */
  locale?: string;
  /** 输出格式，默认 datetime */
  format?: EasyTimeTextFormat;
  /** 是否使用 12 小时制，默认 false */
  hour12?: boolean;
  /** 是否展示 UTC+时区偏移，默认 true */
  showTimeZone?: boolean;
  /** 文字尺寸，默认 default */
  size?: EasyTimeTextSize;
  /** 空值展示文本，默认 "-" */
  emptyText?: string;
  /** 同日区间分隔符，默认 " - " */
  rangeSeparator?: string;
  /** 多日期分组分隔符，默认 "; " */
  groupSeparator?: string;
}

const timeTextSizeClassNames: Record<EasyTimeTextSize, string> = {
  sm: "text-xs leading-5",
  default: "text-sm leading-5",
  lg: "text-base leading-6",
};

export const EasyTimeText = React.forwardRef<HTMLSpanElement, EasyTimeTextProps>(
  function EasyTimeText(
    {
      value,
      timeZone,
      locale,
      format,
      hour12,
      showTimeZone,
      size = "default",
      emptyText,
      rangeSeparator,
      groupSeparator,
      className,
      ...props
    },
    ref,
  ) {
    const displayText = React.useMemo(
      () =>
        formatTimeText(value, {
          timeZone,
          locale,
          format,
          hour12,
          showTimeZone,
          emptyText,
          rangeSeparator,
          groupSeparator,
        }),
      [
        value,
        timeZone,
        locale,
        format,
        hour12,
        showTimeZone,
        emptyText,
        rangeSeparator,
        groupSeparator,
      ],
    );

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-mono tabular-nums",
          timeTextSizeClassNames[size],
          className,
        )}
        data-size={size}
        data-slot="time-text"
        {...props}
      >
        {displayText}
      </span>
    );
  },
);
