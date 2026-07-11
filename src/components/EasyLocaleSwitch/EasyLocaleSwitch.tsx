import type React from "react";
import { type VariantProps } from "class-variance-authority";
import cnFlag from "flag-icons/flags/4x3/cn.svg";
import gbFlag from "flag-icons/flags/4x3/gb.svg";
import vnFlag from "flag-icons/flags/4x3/vn.svg";
import { type easyButtonVariants, EasyButton } from "@/components/EasyButton";
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlList,
  type SegmentedControlSize,
} from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

type EasyButtonSize = NonNullable<VariantProps<typeof easyButtonVariants>["size"]>;

export type EasyLocaleSwitchSize = EasyButtonSize | SegmentedControlSize;

export type EasyLocaleOption = {
  /** Locale value passed to value/onChange, such as "vi" or "en-US". */
  locale: string;
  /** Display label shown next to the flag when showLabel is enabled. */
  label: string;
  /** flag-icons country code fallback, such as "vn", "gb", or "cn". */
  flag: string;
  /** Optional custom flag image source. */
  flagSrc?: string;
};

export type EasyLocaleSwitchProps = {
  locales?: EasyLocaleOption[];
  value: string;
  onChange: (locale: string) => void;
  className?: string;
  showLabel?: boolean;
  size?: EasyLocaleSwitchSize;
  variant?: "default" | "pill";
};

export const defaultEasyLocales: EasyLocaleOption[] = [
  { locale: "vi", label: "VI", flag: "vn", flagSrc: vnFlag },
  { locale: "en-US", label: "EN", flag: "gb", flagSrc: gbFlag },
  { locale: "zh-CN", label: "中文", flag: "cn", flagSrc: cnFlag },
];

const localeFlagSizeClasses: Record<SegmentedControlSize, string> = {
  xs: "h-3 w-4",
  sm: "h-3.5 w-[18px]",
  md: "h-3.5 w-[18px]",
  lg: "h-4 w-5",
};

const localeIconOnlyItemSizeClasses: Record<SegmentedControlSize, string> = {
  xs: "min-w-6 px-0",
  sm: "min-w-7 px-0",
  md: "min-w-8 px-0",
  lg: "min-w-9 px-0",
};

function getSegmentedControlSize(size: EasyLocaleSwitchSize): SegmentedControlSize {
  if (size === "xs") {
    return "xs";
  }
  if (size === "lg" || size === "xl" || size === "icon-lg" || size === "icon-xl") {
    return "lg";
  }
  if (size === "default" || size === "icon") {
    return "md";
  }
  return "sm";
}

function getButtonSize(size: EasyLocaleSwitchSize): EasyButtonSize {
  if (size === "md") {
    return "default";
  }
  return size as EasyButtonSize;
}

export function EasyLocaleSwitch({
  locales = defaultEasyLocales,
  value,
  onChange,
  className,
  showLabel = true,
  size = "xs",
  variant = "pill",
}: EasyLocaleSwitchProps): React.ReactElement {
  if (variant === "pill") {
    const segmentedSize = getSegmentedControlSize(size);

    return (
      <SegmentedControl
        className={cn("rounded-full", className)}
        data-slot="easy-locale-switch"
        onValueChange={(nextValue) => onChange(String(nextValue))}
        size={segmentedSize}
        value={value}
      >
        <SegmentedControlList
          className="rounded-full border border-border bg-muted [&_[data-slot=segmented-control-indicator]]:rounded-full"
          indicatorClassName="ring-1 ring-border/50"
        >
          {locales.map((item) => {
            const flagEl = item.flagSrc ? (
              <img
                alt=""
                className={cn(
                  "rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,.08)]",
                  localeFlagSizeClasses[segmentedSize],
                )}
                src={item.flagSrc}
              />
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  "fi rounded-[2px]",
                  localeFlagSizeClasses[segmentedSize],
                  `fi-${item.flag}`,
                )}
              />
            );

            return (
              <SegmentedControlItem
                aria-label={item.label}
                className={cn(
                  "rounded-full",
                  !showLabel && localeIconOnlyItemSizeClasses[segmentedSize],
                )}
                key={item.locale}
                title={item.label}
                value={item.locale}
              >
                {flagEl}
                {showLabel && <span>{item.label}</span>}
              </SegmentedControlItem>
            );
          })}
        </SegmentedControlList>
      </SegmentedControl>
    );
  }

  return (
    <div className={cn("flex gap-1", className)} data-slot="easy-locale-switch">
      {locales.map((item) => {
        const active = value === item.locale;

        return (
          <EasyButton
            aria-pressed={active}
            key={item.locale}
            onClick={() => onChange(item.locale)}
            size={getButtonSize(size)}
            variant={active ? "default" : "outline"}
          >
            <span
              aria-hidden="true"
              className={cn("fi rounded-sm", `fi-${item.flag}`)}
            />
            {showLabel && <span>{item.label}</span>}
          </EasyButton>
        );
      })}
    </div>
  );
}
