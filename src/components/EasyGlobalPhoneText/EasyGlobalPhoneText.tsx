"use client";

import * as React from "react";
import { CopyableText } from "@/components/ui/copyable-text";
import { cn } from "@/lib/utils";

export type PhoneDisplayFormat = "international" | "national";

/**
 * trunk prefix 映射表：区号 → 国内格式前缀。
 * 越南 (84) 和中国 (86) 的国内格式均以 "0" 作为 trunk prefix。
 */
const DEFAULT_TRUNK_PREFIX_MAP: Record<string, string> = {
  "84": "0",
  "86": "0",
};

export interface EasyGlobalPhoneTextProps {
  cc: string;
  phone: string;
  /** 显示格式：international (+84 xxx) 或 national (0xxx)，默认 international */
  format?: PhoneDisplayFormat;
  /** 是否可复制（复制内容始终为国际格式 E.164），默认 false */
  copyable?: boolean;
  /** 自定义 trunk prefix 映射，用于扩展更多国家 */
  trunkPrefixMap?: Record<string, string>;
  className?: string;
}

function formatPhone(
  cc: string,
  phone: string,
  format: PhoneDisplayFormat,
  trunkPrefixMap: Record<string, string>,
): string {
  if (format === "national") {
    const prefix = trunkPrefixMap[cc];
    if (prefix !== undefined) {
      return `${prefix}${phone}`;
    }
    return `+${cc} ${phone}`;
  }
  return `+${cc} ${phone}`;
}

export const EasyGlobalPhoneText = React.forwardRef<
  HTMLElement,
  EasyGlobalPhoneTextProps
>(function EasyGlobalPhoneText(
  {
    cc,
    phone,
    format = "international",
    copyable = false,
    trunkPrefixMap,
    className,
  },
  ref,
) {
  const mergedTrunkMap = React.useMemo(
    () => ({ ...DEFAULT_TRUNK_PREFIX_MAP, ...trunkPrefixMap }),
    [trunkPrefixMap],
  );

  const displayText = formatPhone(cc, phone, format, mergedTrunkMap);
  const copyValue = `+${cc}${phone}`;

  if (copyable) {
    return (
      <CopyableText
        ref={ref}
        value={copyValue}
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
      data-slot="global-phone-text"
    >
      {displayText}
    </span>
  );
});
