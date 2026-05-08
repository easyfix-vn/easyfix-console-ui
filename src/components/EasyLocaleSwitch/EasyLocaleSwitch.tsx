import type React from "react";
import { type VariantProps } from "class-variance-authority";
import cnFlag from "flag-icons/flags/4x3/cn.svg";
import gbFlag from "flag-icons/flags/4x3/gb.svg";
import vnFlag from "flag-icons/flags/4x3/vn.svg";
import { type easyButtonVariants, EasyButton } from "@/components/EasyButton";
import { cn } from "@/lib/utils";

export type EasyLocaleOption = {
  locale: string;
  label: string;
  flag: string;
  flagSrc?: string;
};

export type EasyLocaleSwitchProps = {
  locales?: EasyLocaleOption[];
  value: string;
  onChange: (locale: string) => void;
  className?: string;
  showLabel?: boolean;
  size?: VariantProps<typeof easyButtonVariants>["size"];
  variant?: "default" | "pill";
};

export const defaultEasyLocales: EasyLocaleOption[] = [
  { locale: "zh-CN", label: "中文", flag: "cn", flagSrc: cnFlag },
  { locale: "en-US", label: "EN", flag: "gb", flagSrc: gbFlag },
  { locale: "vi", label: "VI", flag: "vn", flagSrc: vnFlag },
];

export function EasyLocaleSwitch({
  locales = defaultEasyLocales,
  value,
  onChange,
  className,
  showLabel = true,
  size = "xs",
  variant = "default",
}: EasyLocaleSwitchProps): React.ReactElement {
  if (variant === "pill") {
    return (
      <div
        className={cn(
          "flex rounded-full border border-border bg-muted/50 p-0.5",
          className,
        )}
        data-slot="easy-locale-switch"
      >
        {locales.map((item) => {
          const active = value === item.locale;
          const flagEl = item.flagSrc ? (
            <img
              src={item.flagSrc}
              alt=""
              className="h-3.5 w-[18px] rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,.08)]"
            />
          ) : (
            <span
              aria-hidden="true"
              className={cn("fi h-3.5 w-[18px] rounded-[2px]", `fi-${item.flag}`)}
            />
          );
          return (
            <button
              aria-label={item.label}
              aria-pressed={active}
              key={item.locale}
              type="button"
              title={item.label}
              onClick={() => onChange(item.locale)}
              className={cn(
                "flex items-center justify-center rounded-full text-muted-foreground transition",
                showLabel ? "gap-1 px-2.5 py-1 text-xs font-medium" : "size-8",
                active && "bg-background text-foreground shadow-xs",
              )}
            >
              {flagEl}
              {showLabel && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
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
            size={size}
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
