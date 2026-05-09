"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import type React from "react";
import { cn } from "@/lib/utils";

export function CheckboxCards({
  className,
  ...props
}: CheckboxGroupPrimitive.Props): React.ReactElement {
  return (
    <CheckboxGroupPrimitive
      className={cn("grid gap-3 sm:grid-cols-2", className)}
      data-slot="checkbox-cards"
      {...props}
    />
  );
}

export type CheckboxCardItemProps = CheckboxPrimitive.Root.Props & {
  title?: React.ReactNode;
  description?: React.ReactNode;
};

export function CheckboxCardItem({
  className,
  title,
  description,
  children,
  ...props
}: CheckboxCardItemProps): React.ReactElement {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 outline-none transition-shadow ring-ring/24 not-data-disabled:hover:bg-accent/50 focus-visible:ring-[3px] data-checked:border-primary data-checked:bg-primary/4 data-disabled:cursor-not-allowed data-disabled:opacity-64",
        className,
      )}
      data-slot="checkbox-card-item"
      {...props}
    >
      {/*
        改用普通 span 占位以固定布局：始终渲染指示器外框，仅在 root data-checked
        时切换颜色并显示勾选图标，避免选中态切换时 DOM 跳动。
      */}
      <span
        className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-[.25rem] border border-input bg-background shadow-xs/5 text-primary-foreground transition-colors in-data-checked:border-0 in-data-checked:bg-primary sm:size-4"
        data-slot="checkbox-card-indicator"
        aria-hidden="true"
      >
        <svg
          aria-hidden="true"
          className="size-3.5 opacity-0 transition-opacity in-data-checked:opacity-100 sm:size-3"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
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
    </CheckboxPrimitive.Root>
  );
}
