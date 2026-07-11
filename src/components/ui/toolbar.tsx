"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";

export function Toolbar({
  className,
  ...props
}: ToolbarPrimitive.Root.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Root
      className={cn(
        "relative flex gap-2 rounded-xl border bg-card not-dark:bg-clip-padding p-1 text-card-foreground",
        className,
      )}
      data-slot="toolbar"
      {...props}
    />
  );
}

export type ToolbarButtonProps = ToolbarPrimitive.Button.Props & {
  label?: React.ReactNode;
  showLabel?: boolean;
};

export function ToolbarButton({
  "aria-label": ariaLabel,
  children,
  className,
  label,
  showLabel = false,
  ...props
}: ToolbarButtonProps): React.ReactElement {
  const accessibleLabel =
    typeof label === "string" && ariaLabel === undefined ? label : ariaLabel;
  const content = (
    <>
      {children}
      {showLabel && label ? (
        <span className="truncate text-sm leading-none">{label}</span>
      ) : null}
    </>
  );
  const button = (
    <ToolbarPrimitive.Button
      aria-label={accessibleLabel}
      className={cn(className)}
      data-slot="toolbar-button"
      {...props}
    >
      {content}
    </ToolbarPrimitive.Button>
  );

  if (!label || showLabel) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipPopup side="bottom">{label}</TooltipPopup>
    </Tooltip>
  );
}

export function ToolbarLink({
  className,
  ...props
}: ToolbarPrimitive.Link.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Link
      className={cn(className)}
      data-slot="toolbar-link"
      {...props}
    />
  );
}

export function ToolbarInput({
  className,
  ...props
}: ToolbarPrimitive.Input.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Input
      className={cn(className)}
      data-slot="toolbar-input"
      {...props}
    />
  );
}

export function ToolbarGroup({
  className,
  ...props
}: ToolbarPrimitive.Group.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Group
      className={cn("flex items-center gap-1", className)}
      data-slot="toolbar-group"
      {...props}
    />
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: ToolbarPrimitive.Separator.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Separator
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:my-0.5 data-[orientation=vertical]:my-1.5 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
      )}
      data-slot="toolbar-separator"
      {...props}
    />
  );
}

export { ToolbarPrimitive };
