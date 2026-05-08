"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type React from "react";
import { cn } from "@/lib/utils";

export type EasyTabsVariant = "default" | "underline";

export type EasyTabItem = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

export function EasyTabs({
  className,
  ...props
}: TabsPrimitive.Root.Props): React.ReactElement {
  return (
    <TabsPrimitive.Root
      className={cn(
        "flex flex-col gap-2 data-[orientation=vertical]:flex-row",
        className,
      )}
      data-slot="easy-tabs"
      {...props}
    />
  );
}

export function EasyTabsList({
  variant = "default",
  className,
  children,
  ...props
}: TabsPrimitive.List.Props & {
  variant?: EasyTabsVariant;
}): React.ReactElement {
  return (
    <TabsPrimitive.List
      className={cn(
        "relative z-0 flex w-fit items-center justify-center gap-x-0.5 text-muted-foreground",
        "data-[orientation=vertical]:flex-col",
        variant === "default"
          ? "rounded-lg bg-muted p-0.5 text-muted-foreground/72"
          : "data-[orientation=vertical]:px-1 data-[orientation=horizontal]:py-1 *:data-[slot=easy-tabs-tab]:hover:bg-accent",
        className,
      )}
      data-slot="easy-tabs-list"
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        className={cn(
          "absolute bottom-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-(--active-tab-bottom) transition-[width,translate] duration-200 ease-in-out",
          variant === "underline"
            ? "z-10 bg-primary data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5 data-[orientation=vertical]:-translate-x-px data-[orientation=horizontal]:translate-y-px"
            : "-z-1 rounded-md bg-background shadow-sm/5 dark:bg-input",
        )}
        data-slot="easy-tab-indicator"
      />
    </TabsPrimitive.List>
  );
}

export function EasyTabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props): React.ReactElement {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative flex h-9 shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-[calc(--spacing(2.5)-1px)] font-medium text-base outline-none transition-[color,background-color,box-shadow] hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-active:text-foreground data-disabled:opacity-64 sm:h-8 sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
        className,
      )}
      data-slot="easy-tabs-tab"
      {...props}
    />
  );
}

export function EasyTabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props): React.ReactElement {
  return (
    <TabsPrimitive.Panel
      className={cn("flex-1 outline-none", className)}
      data-slot="easy-tabs-content"
      {...props}
    />
  );
}

export type EasyTabContainerProps = Omit<
  TabsPrimitive.Root.Props,
  "children"
> & {
  items: EasyTabItem[];
  variant?: EasyTabsVariant;
  listClassName?: string;
  contentClassName?: string;
};

export function EasyTabContainer({
  items,
  variant,
  listClassName,
  contentClassName,
  ...props
}: EasyTabContainerProps): React.ReactElement {
  return (
    <EasyTabs {...props}>
      <EasyTabsList className={listClassName} variant={variant}>
        {items.map((item) => (
          <EasyTabsTrigger
            disabled={item.disabled}
            key={item.value}
            value={item.value}
          >
            {item.label}
          </EasyTabsTrigger>
        ))}
      </EasyTabsList>
      {items.map((item) => (
        <EasyTabsContent
          className={contentClassName}
          key={item.value}
          value={item.value}
        >
          {item.content}
        </EasyTabsContent>
      ))}
    </EasyTabs>
  );
}

export { TabsPrimitive as EasyTabsPrimitive };
