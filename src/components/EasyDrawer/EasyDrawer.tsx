"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type EasyDrawerPosition = "right" | "left" | "top" | "bottom";
export type EasyDrawerWidth = "sm" | "md" | "lg" | "xl" | "full";

const directionMap: Record<
  EasyDrawerPosition,
  DrawerPrimitive.Root.Props["swipeDirection"]
> = {
  bottom: "down",
  left: "left",
  right: "right",
  top: "up",
};

const widthClassMap: Record<EasyDrawerWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-full",
};

export function EasyDrawerRoot({
  position = "right",
  swipeDirection,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  onOpenChange,
  ...props
}: DrawerPrimitive.Root.Props & {
  position?: EasyDrawerPosition;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}): React.ReactElement {
  const handleOpenChange = React.useCallback<
    NonNullable<DrawerPrimitive.Root.Props["onOpenChange"]>
  >(
    (open, details) => {
      if (!open && !closeOnEscape && details.reason === "escape-key") {
        details.cancel();
        return;
      }
      onOpenChange?.(open, details);
    },
    [closeOnEscape, onOpenChange],
  );

  return (
    <DrawerPrimitive.Root
      swipeDirection={swipeDirection ?? directionMap[position]}
      disablePointerDismissal={!closeOnBackdropClick}
      onOpenChange={handleOpenChange}
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
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      data-slot="easy-drawer-backdrop"
      {...props}
    />
  );
}

export function EasyDrawerViewport({
  className,
  position = "right",
  ...props
}: DrawerPrimitive.Viewport.Props & {
  position?: EasyDrawerPosition;
}): React.ReactElement {
  return (
    <DrawerPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50",
        (position === "right" || position === "left") && "flex items-stretch",
        position === "right" && "justify-end",
        position === "left" && "justify-start",
        position === "bottom" && "flex flex-col justify-end",
        position === "top" && "flex flex-col justify-start",
        className,
      )}
      data-slot="easy-drawer-viewport"
      {...props}
    />
  );
}

export function EasyDrawerPopup({
  className,
  position = "right",
  width = "md",
  showCloseButton = true,
  children,
  ...props
}: DrawerPrimitive.Popup.Props & {
  position?: EasyDrawerPosition;
  width?: EasyDrawerWidth;
  showCloseButton?: boolean;
}): React.ReactElement {
  const widthClass = widthClassMap[width] ?? widthClassMap.md;
  return (
    <EasyDrawerPortal>
      <EasyDrawerBackdrop />
      <EasyDrawerViewport position={position}>
        <DrawerPrimitive.Popup
          className={cn(
            "flex max-h-full min-h-0 flex-col bg-background text-foreground shadow-xl outline-none transition-transform duration-300 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
            (position === "right" || position === "left") &&
              cn(
                "h-full w-[calc(100vw-3rem)]",
                widthClass,
              ),
            position === "right" &&
              "border-s border-border data-ending-style:translate-x-full data-starting-style:translate-x-full",
            position === "left" &&
              "border-e border-border data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
            position === "bottom" &&
              "max-h-[85vh] w-full rounded-t-xl border-t border-border data-ending-style:translate-y-full data-starting-style:translate-y-full",
            position === "top" &&
              "max-h-[85vh] w-full rounded-b-xl border-b border-border data-ending-style:-translate-y-full data-starting-style:-translate-y-full",
            className,
          )}
          data-slot="easy-drawer-popup"
          {...props}
        >
          {showCloseButton && (
            <EasyDrawerClose
              aria-label="Close drawer"
              className="absolute end-3 top-3 z-10 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </EasyDrawerClose>
          )}
          {children}
        </DrawerPrimitive.Popup>
      </EasyDrawerViewport>
    </EasyDrawerPortal>
  );
}

export function EasyDrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-b border-border px-6 py-4 pe-12",
        className,
      )}
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
      className={cn("min-h-0 flex-1 overflow-auto px-6 py-5 text-sm", className)}
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
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border px-6 py-3 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
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
  width?: EasyDrawerWidth;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export function EasyDrawer({
  trigger,
  title,
  description,
  footer,
  children,
  position = "right",
  width = "md",
  contentClassName,
  showCloseButton = true,
  closeOnBackdropClick,
  closeOnEscape,
  ...props
}: EasyDrawerProps): React.ReactElement {
  return (
    <EasyDrawerRoot
      position={position}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
      {...props}
    >
      {trigger && <EasyDrawerTrigger render={trigger} />}
      <EasyDrawerPopup
        className={contentClassName}
        position={position}
        showCloseButton={showCloseButton}
        width={width}
      >
        {(title || description) && (
          <EasyDrawerHeader>
            {title && (
              <EasyDrawerTitle className="text-lg font-semibold leading-none tracking-tight text-foreground">
                {title}
              </EasyDrawerTitle>
            )}
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
