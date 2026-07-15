"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type React from "react";
import { cn } from "@/lib/utils";

export type FieldOrientation = "vertical" | "horizontal";

export interface FieldProps extends FieldPrimitive.Root.Props {
  /** 字段的布局方向，默认纵向排列 */
  orientation?: FieldOrientation;
  /** 横向布局中标签区域宽度；number 按 px 处理 */
  labelWidth?: React.CSSProperties["width"];
}

export function Field({
  className,
  orientation = "vertical",
  labelWidth,
  style,
  ...props
}: FieldProps): React.ReactElement {
  const resolvedLabelWidth =
    typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth;

  return (
    <FieldPrimitive.Root
      {...props}
      className={cn(
        orientation === "horizontal"
          ? "grid items-start gap-x-3 gap-y-2 [grid-template-columns:var(--field-label-width)_minmax(0,1fr)] [&>[data-slot=field-label]]:col-start-1 [&>[data-slot=field-label]]:row-start-1 [&>[data-slot=field-label]]:max-w-full [&>[data-slot=field-label]]:justify-self-end [&>[data-slot=field-label]]:self-start [&>[data-slot=field-label]]:pt-1.5 [&>[data-slot=field-label]]:text-end [&>[data-slot=field-label]]:leading-4 [&>[data-slot=field-item]]:col-start-2 [&>[data-slot=field-item]]:row-start-1 [&>[data-slot=field-description]]:col-start-2 [&>[data-slot=field-error]]:col-start-2"
          : "flex flex-col items-stretch gap-2",
        className,
      )}
      data-slot="field"
      data-orientation={orientation}
      style={
        orientation === "horizontal"
          ? ({
              ...style,
              "--field-label-width": resolvedLabelWidth ?? "8rem",
            } as React.CSSProperties)
          : style
      }
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: FieldPrimitive.Label.Props): React.ReactElement {
  return (
    <FieldPrimitive.Label
      className={cn(
        "inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground data-disabled:opacity-64 sm:text-sm/4",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

export function FieldItem({
  className,
  ...props
}: FieldPrimitive.Item.Props): React.ReactElement {
  return (
    <FieldPrimitive.Item
      className={cn("flex w-full min-w-0", className)}
      data-slot="field-item"
      {...props}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props): React.ReactElement {
  return (
    <FieldPrimitive.Description
      className={cn("text-muted-foreground text-xs", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

export function FieldError({
  className,
  ...props
}: FieldPrimitive.Error.Props): React.ReactElement {
  return (
    <FieldPrimitive.Error
      className={cn("text-destructive-foreground text-xs", className)}
      data-slot="field-error"
      {...props}
    />
  );
}

export const FieldControl: typeof FieldPrimitive.Control =
  FieldPrimitive.Control;
export const FieldValidity: typeof FieldPrimitive.Validity =
  FieldPrimitive.Validity;

export { FieldPrimitive };
