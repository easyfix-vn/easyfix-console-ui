"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";
import { cn } from "@/lib/utils";

export type SegmentedControlSize = "xs" | "sm" | "md" | "lg";

export type SegmentedControlProps = TabsPrimitive.Root.Props & {
  size?: SegmentedControlSize;
};

export type SegmentedControlListProps = TabsPrimitive.List.Props & {
  size?: SegmentedControlSize;
  indicatorClassName?: string;
};

export type SegmentedControlItemProps = TabsPrimitive.Tab.Props & {
  size?: SegmentedControlSize;
};

const SegmentedControlSizeContext =
  React.createContext<SegmentedControlSize>("sm");

const segmentedControlListSizeClasses: Record<SegmentedControlSize, string> = {
  xs: "gap-x-0.5 rounded-md p-0.5",
  sm: "gap-x-0.5 rounded-lg p-0.5",
  md: "gap-x-0.5 rounded-lg p-1",
  lg: "gap-x-1 rounded-xl p-1",
};

const segmentedControlIndicatorSizeClasses: Record<
  SegmentedControlSize,
  string
> = {
  xs: "rounded-[calc(var(--radius-md)-1px)]",
  sm: "rounded-md",
  md: "rounded-md",
  lg: "rounded-lg",
};

const segmentedControlItemSizeClasses: Record<SegmentedControlSize, string> = {
  xs: "h-6 min-w-9 gap-1 rounded-[calc(var(--radius-md)-1px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
  sm: "h-7 min-w-[3rem] gap-1.5 rounded-md px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
  md: "h-8 min-w-14 gap-1.5 rounded-md px-3.5 text-sm [&_svg:not([class*='size-'])]:size-4",
  lg: "h-9 min-w-16 gap-2 rounded-lg px-4 text-sm [&_svg:not([class*='size-'])]:size-4.5",
};

export function SegmentedControl({
  className,
  size = "sm",
  ...props
}: SegmentedControlProps): React.ReactElement {
  return (
    <SegmentedControlSizeContext.Provider value={size}>
      <TabsPrimitive.Root
        className={cn("inline-flex", className)}
        data-slot="segmented-control"
        {...props}
      />
    </SegmentedControlSizeContext.Provider>
  );
}

export function SegmentedControlList({
  className,
  children,
  indicatorClassName,
  size,
  ...props
}: SegmentedControlListProps): React.ReactElement {
  const contextSize = React.useContext(SegmentedControlSizeContext);
  const resolvedSize = size ?? contextSize;

  return (
    <SegmentedControlSizeContext.Provider value={resolvedSize}>
      <TabsPrimitive.List
        className={cn(
          "relative z-0 inline-flex items-center bg-muted text-muted-foreground/72",
          segmentedControlListSizeClasses[resolvedSize],
          className,
        )}
        data-slot="segmented-control-list"
        {...props}
      >
        {children}
        <TabsPrimitive.Indicator
          className={cn(
            "absolute bottom-0 left-0 -z-1 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-(--active-tab-bottom) bg-background shadow-sm/5 transition-[width,translate] duration-200 ease-in-out dark:bg-input",
            segmentedControlIndicatorSizeClasses[resolvedSize],
            indicatorClassName,
          )}
          data-slot="segmented-control-indicator"
        />
      </TabsPrimitive.List>
    </SegmentedControlSizeContext.Provider>
  );
}

export function SegmentedControlItem({
  className,
  size,
  ...props
}: SegmentedControlItemProps): React.ReactElement {
  const contextSize = React.useContext(SegmentedControlSizeContext);
  const resolvedSize = size ?? contextSize;

  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative flex flex-1 shrink-0 cursor-pointer items-center justify-center overflow-hidden truncate whitespace-nowrap border border-transparent font-medium outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-disabled:opacity-64 data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
        segmentedControlItemSizeClasses[resolvedSize],
        className,
      )}
      data-slot="segmented-control-item"
      {...props}
    />
  );
}
