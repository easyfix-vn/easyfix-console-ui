"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import type React from "react";
import { EasyButton } from "@/components/EasyButton";
import { cn } from "@/lib/utils";

export type EasyDrawerPosition = "right" | "left" | "top" | "bottom";

const directionMap: Record<
  EasyDrawerPosition,
  DrawerPrimitive.Root.Props["swipeDirection"]
> = {
  bottom: "down",
  left: "left",
  right: "right",
  top: "up",
};

export function EasyDrawerRoot({
  position = "right",
  swipeDirection,
  ...props
}: DrawerPrimitive.Root.Props & {
  position?: EasyDrawerPosition;
}): React.ReactElement {
  return (
    <DrawerPrimitive.Root
      swipeDirection={swipeDirection ?? directionMap[position]}
      {...props}
    />
  );
}

export const EasyDrawerTrigger = DrawerPrimitive.Trigger;
export const EasyDrawerClose = DrawerPrimitive.Close;
export const EasyDrawerPortal = DrawerPrimitive.Portal;
export const EasyDrawerTitle = DrawerPrimitive.Title;
export const EasyDrawerDescription = DrawerPrimitive.Description;

export function EasyDrawerBackdrop({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props): React.ReactElement {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      data-slot="easy-drawer-backdrop"
      {...props}
    />
  );
}

export function EasyDrawerPopup({
  className,
  position = "right",
  showCloseButton = true,
  children,
  ...props
}: DrawerPrimitive.Popup.Props & {
  position?: EasyDrawerPosition;
  showCloseButton?: boolean;
}): React.ReactElement {
  return (
    <EasyDrawerPortal>
      <EasyDrawerBackdrop />
      <DrawerPrimitive.Popup
        className={cn(
          "fixed z-50 flex max-h-full min-h-0 flex-col border-border bg-popover text-popover-foreground shadow-lg outline-none transition-transform duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0",
          position === "right" &&
            "inset-y-0 right-0 w-[calc(100%-3rem)] max-w-md border-l data-ending-style:translate-x-full data-starting-style:translate-x-full",
          position === "left" &&
            "inset-y-0 left-0 w-[calc(100%-3rem)] max-w-md border-r data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
          position === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t data-ending-style:translate-y-full data-starting-style:translate-y-full",
          position === "top" &&
            "inset-x-0 top-0 max-h-[85vh] rounded-b-2xl border-b data-ending-style:-translate-y-full data-starting-style:-translate-y-full",
          className,
        )}
        data-slot="easy-drawer-popup"
        {...props}
      >
        {showCloseButton && (
          <EasyDrawerClose
            render={
              <EasyButton
                aria-label="Close drawer"
                className="absolute right-3 top-3 z-10"
                size="icon-xs"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </EasyButton>
            }
          />
        )}
        {children}
      </DrawerPrimitive.Popup>
    </EasyDrawerPortal>
  );
}

export function EasyDrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn("space-y-1.5 border-b border-border p-4 pr-12", className)}
      data-slot="easy-drawer-header"
      {...props}
    />
  );
}

export function EasyDrawerBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-auto p-4", className)}
      data-slot="easy-drawer-body"
      {...props}
    />
  );
}

export function EasyDrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn("flex justify-end gap-2 border-t border-border p-4", className)}
      data-slot="easy-drawer-footer"
      {...props}
    />
  );
}

export type EasyDrawerProps = DrawerPrimitive.Root.Props & {
  trigger?: React.ReactElement;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  position?: EasyDrawerPosition;
  contentClassName?: string;
};

export function EasyDrawer({
  trigger,
  title,
  description,
  footer,
  children,
  position = "right",
  contentClassName,
  ...props
}: EasyDrawerProps): React.ReactElement {
  return (
    <EasyDrawerRoot position={position} {...props}>
      {trigger && <EasyDrawerTrigger render={trigger} />}
      <EasyDrawerPopup className={contentClassName} position={position}>
        {(title || description) && (
          <EasyDrawerHeader>
            {title && <EasyDrawerTitle className="font-semibold">{title}</EasyDrawerTitle>}
            {description && (
              <EasyDrawerDescription className="text-sm text-muted-foreground">
                {description}
              </EasyDrawerDescription>
            )}
          </EasyDrawerHeader>
        )}
        <EasyDrawerBody>{children}</EasyDrawerBody>
        {footer && <EasyDrawerFooter>{footer}</EasyDrawerFooter>}
      </EasyDrawerPopup>
    </EasyDrawerRoot>
  );
}

export { DrawerPrimitive as EasyDrawerPrimitive };
