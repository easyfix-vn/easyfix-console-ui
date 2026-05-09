"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import type React from "react";
import { cn } from "@/lib/utils";

export function RadioCards({
  className,
  ...props
}: RadioGroupPrimitive.Props): React.ReactElement {
  return (
    <RadioGroupPrimitive
      className={cn("grid gap-3 sm:grid-cols-2", className)}
      data-slot="radio-cards"
      {...props}
    />
  );
}

export type RadioCardItemProps = RadioPrimitive.Root.Props & {
  title?: React.ReactNode;
  description?: React.ReactNode;
};

export function RadioCardItem({
  className,
  title,
  description,
  children,
  ...props
}: RadioCardItemProps): React.ReactElement {
  return (
    <RadioPrimitive.Root
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 outline-none transition-shadow ring-ring/24 not-data-disabled:hover:bg-accent/50 focus-visible:ring-[3px] data-checked:border-primary data-checked:bg-primary/4 data-disabled:cursor-not-allowed data-disabled:opacity-64",
        className,
      )}
      data-slot="radio-card-item"
      {...props}
    >
      {/*
        改用普通 div 占位以固定布局：始终渲染指示器外框（保留位置），
        仅在 root data-checked 时改变颜色并显示内部圆点，避免选中态切换时 DOM 跳动。
      */}
      <span
        className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border border-input bg-background shadow-xs/5 transition-colors in-data-checked:border-0 in-data-checked:bg-primary sm:size-4"
        data-slot="radio-card-indicator"
        aria-hidden="true"
      >
        <span className="size-2 rounded-full bg-primary-foreground opacity-0 transition-opacity in-data-checked:opacity-100 sm:size-1.5" />
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-medium text-sm leading-tight">{title}</div>
        )}
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        )}
        {children}
      </div>
    </RadioPrimitive.Root>
  );
}
