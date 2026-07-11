"use client";

import NumberFlowPrimitive, {
  NumberFlowGroup as NumberFlowGroupPrimitive,
  type Format as NumberFlowFormat,
} from "@number-flow/react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type NumberFlowSize = "sm" | "default" | "lg" | "xl";
export type NumberFlowVariant = "default" | "muted" | "success" | "danger";
export type NumberFlowTrend =
  | number
  | ((oldValue: number, value: number) => number);

export interface NumberFlowProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  value: number;
  locales?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  animated?: boolean;
  animateOnMount?: boolean;
  duration?: number;
  trend?: NumberFlowTrend;
  respectMotionPreference?: boolean;
  size?: NumberFlowSize;
  variant?: NumberFlowVariant;
  onAnimationsStart?: () => void;
  onAnimationsFinish?: () => void;
}

export interface NumberFlowGroupProps {
  children?: React.ReactNode;
}

const numberFlowSizeClassNames: Record<NumberFlowSize, string> = {
  sm: "text-sm leading-5",
  default: "text-base leading-6",
  lg: "text-xl leading-7",
  xl: "text-3xl leading-9",
};

const numberFlowVariantClassNames: Record<NumberFlowVariant, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-destructive",
};

function formatNumber(
  value: number,
  locales?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat(locales, format).format(value);
  } catch {
    return String(value);
  }
}

function getTrendValue(
  trend: NumberFlowTrend | undefined,
  oldValue: number,
  value: number,
): number {
  if (typeof trend === "function") {
    return trend(oldValue, value);
  }

  return trend ?? Math.sign(value - oldValue);
}

function getTrendName(trendValue: number): "up" | "down" | "none" {
  if (trendValue > 0) {
    return "up";
  }

  if (trendValue < 0) {
    return "down";
  }

  return "none";
}

export function NumberFlow({
  value,
  locales,
  format,
  prefix,
  suffix,
  animated = true,
  animateOnMount = true,
  duration = 520,
  trend,
  respectMotionPreference = true,
  size = "default",
  variant = "default",
  onAnimationsStart,
  onAnimationsFinish,
  className,
  ...props
}: NumberFlowProps): React.ReactElement {
  const previousValueRef = React.useRef(value);
  const [displayValue, setDisplayValue] = React.useState(() =>
    animated && animateOnMount ? 0 : value,
  );
  const [trendName, setTrendName] = React.useState<"up" | "down" | "none">(
    "none",
  );

  React.useEffect(() => {
    if (!animated || !animateOnMount || typeof window === "undefined") {
      setDisplayValue(value);
      return;
    }

    const frame = window.requestAnimationFrame(() => setDisplayValue(value));
    return () => window.cancelAnimationFrame(frame);
  }, [animateOnMount, animated, value]);

  React.useEffect(() => {
    const previousValue = previousValueRef.current;

    if (!Object.is(previousValue, value)) {
      setTrendName(
        getTrendName(getTrendValue(trend, previousValue, value)),
      );
      previousValueRef.current = value;
    }
  }, [trend, value]);

  const finalFormattedValue = React.useMemo(
    () => `${prefix ?? ""}${formatNumber(value, locales, format)}${suffix ?? ""}`,
    [format, locales, prefix, suffix, value],
  );

  return (
    <NumberFlowPrimitive
      {...props}
      aria-label={props["aria-label"] ?? finalFormattedValue}
      animated={animated}
      className={cn(
        "inline-flex items-baseline whitespace-nowrap font-mono tabular-nums transition-colors [&_.number]:align-baseline [&_.section]:align-baseline [&_.symbol]:align-baseline",
        numberFlowSizeClassNames[size],
        numberFlowVariantClassNames[variant],
        trendName === "up" &&
          variant === "default" &&
          "text-emerald-600 dark:text-emerald-400",
        trendName === "down" && variant === "default" && "text-destructive",
        className,
      )}
      data-slot="number-flow"
      data-trend={trendName}
      format={format as NumberFlowFormat | undefined}
      locales={locales}
      onAnimationsFinish={onAnimationsFinish ? () => onAnimationsFinish() : undefined}
      onAnimationsStart={onAnimationsStart ? () => onAnimationsStart() : undefined}
      opacityTiming={{ duration }}
      prefix={prefix}
      respectMotionPreference={respectMotionPreference}
      spinTiming={{ duration }}
      suffix={suffix}
      transformTiming={{ duration }}
      trend={trend}
      value={displayValue}
    />
  );
}

export function NumberFlowGroup({
  children,
}: NumberFlowGroupProps): React.ReactElement {
  return <NumberFlowGroupPrimitive>{children}</NumberFlowGroupPrimitive>;
}
