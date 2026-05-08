import type React from "react";
import { EasyButton } from "@/components/EasyButton";
import { cn } from "@/lib/utils";

export type EasyLocaleOption = {
  locale: string;
  label: string;
  flag: string;
};

export type EasyLocaleSwitchProps = {
  locales?: EasyLocaleOption[];
  value: string;
  onChange: (locale: string) => void;
  className?: string;
  showLabel?: boolean;
};

export const defaultEasyLocales: EasyLocaleOption[] = [
  { locale: "zh-CN", label: "中文", flag: "cn" },
  { locale: "en-US", label: "EN", flag: "gb" },
  { locale: "vi", label: "VI", flag: "vn" },
];

export function EasyLocaleSwitch({
  locales = defaultEasyLocales,
  value,
  onChange,
  className,
  showLabel = true,
}: EasyLocaleSwitchProps): React.ReactElement {
  return (
    <div className={cn("flex gap-1", className)} data-slot="easy-locale-switch">
      {locales.map((item) => {
        const active = value === item.locale;

        return (
          <EasyButton
            aria-pressed={active}
            key={item.locale}
            onClick={() => onChange(item.locale)}
            size="xs"
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
