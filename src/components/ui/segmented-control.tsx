"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";
import { cn } from "@/lib/utils";

export function SegmentedControl({
  className,
  ...props
}: TabsPrimitive.Root.Props): React.ReactElement {
  return (
    <TabsPrimitive.Root
      className={cn("inline-flex", className)}
      data-slot="segmented-control"
      {...props}
    />
  );
}

export function SegmentedControlList({
  className,
  children,
  ...props
}: TabsPrimitive.List.Props): React.ReactElement {
  return (
    <TabsPrimitive.List
      className={cn(
        "relative z-0 inline-flex items-center gap-x-0.5 rounded-lg bg-muted p-0.5 text-muted-foreground/72",
        className,
      )}
      data-slot="segmented-control-list"
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        className="absolute bottom-0 left-0 -z-1 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-(--active-tab-bottom) rounded-md bg-background shadow-sm/5 transition-[width,translate] duration-200 ease-in-out dark:bg-input"
        data-slot="segmented-control-indicator"
      />
    </TabsPrimitive.List>
  );
}

export function SegmentedControlItem({
  className,
  ...props
}: TabsPrimitive.Tab.Props): React.ReactElement {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative flex h-7 min-w-[3rem] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden truncate whitespace-nowrap rounded-md border border-transparent px-3 text-sm font-medium outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-disabled:opacity-64 data-active:text-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
        className,
      )}
      data-slot="segmented-control-item"
      {...props}
    />
  );
}
