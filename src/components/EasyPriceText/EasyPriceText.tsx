"use client";

import * as React from "react";
import { CopyableText } from "@/components/ui/copyable-text";
import { cn } from "@/lib/utils";
import {
  formatPriceText,
  type EasyCurrencyCode,
  type EasyPriceUnitPosition,
  type EasyPriceValue,
} from "./price-format";

export interface EasyPriceTextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value?: EasyPriceValue;
  /** ISO 4217 三字母货币代码，如 VND、USD、CNY。默认 VND */
  currency?: EasyCurrencyCode;
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
  /** 空值展示文本，默认 "-" */
  emptyText?: string;
  /** 是否可复制，默认 false */
  copyable?: boolean;
}

export const EasyPriceText = React.forwardRef<HTMLElement, EasyPriceTextProps>(
  function EasyPriceText(
    {
      value,
      currency = "VND",
      useGrouping = true,
      groupSeparator = ",",
      decimalSeparator = ".",
      unitText,
      unitPosition = "suffix",
      precision,
      emptyText = "-",
      copyable = false,
      className,
      ...props
    },
    ref,
  ) {
    const displayText = React.useMemo(
      () =>
        formatPriceText(value, {
          currency,
          precision,
          useGrouping,
          groupSeparator,
          decimalSeparator,
          unitText,
          unitPosition,
          emptyText,
        }),
      [
        value,
        currency,
        precision,
        useGrouping,
        groupSeparator,
        decimalSeparator,
        unitText,
        unitPosition,
        emptyText,
      ],
    );

    if (copyable) {
      return (
        <CopyableText
          ref={ref}
          value={displayText}
          variant="inline"
          className={className}
        >
          {displayText}
        </CopyableText>
      );
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn("whitespace-nowrap font-mono text-[0.95em]", className)}
        data-slot="price-text"
        {...props}
      >
        {displayText}
      </span>
    );
  },
);
