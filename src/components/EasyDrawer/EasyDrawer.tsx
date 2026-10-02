"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import * as React from "react";
import { canStartDrawerSwipe } from "@/lib/drawer-swipe";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  closeOnSwipe = true,
  onOpenChange,
  ...props
}: DrawerPrimitive.Root.Props & {
  position?: EasyDrawerPosition;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  closeOnSwipe?: boolean;
}): React.ReactElement {
  const handleOpenChange = React.useCallback<
    NonNullable<DrawerPrimitive.Root.Props["onOpenChange"]>
  >(
    (open, details) => {
      if (!open && !closeOnEscape && details.reason === "escape-key") {
        details.cancel();
        return;
      }
      if (!open && !closeOnSwipe && details.reason === "swipe") {
        details.cancel();
        return;
      }
      onOpenChange?.(open, details);
    },
    [closeOnEscape, closeOnSwipe, onOpenChange],
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
        "fixed inset-0 z-50 h-dvh w-screen bg-black/40 backdrop-blur-[2px] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-swiping:duration-0",
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
        "fixed inset-0 z-50 h-dvh w-screen",
        (position === "right" || position === "left") &&
          "flex items-stretch p-3 sm:p-4",
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
  onPointerDown,
  onTouchStart,
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
            "relative flex max-h-full min-h-0 flex-col overflow-hidden bg-background text-foreground shadow-xl outline-none transition-[transform,opacity] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            (position === "right" || position === "left") &&
              cn(
                "h-full w-full rounded-2xl",
                widthClass,
              ),
            position === "right" &&
              "transform-[translateX(var(--drawer-swipe-movement-x))] border-s border-border data-ending-style:transform-[translateX(100%)] data-starting-style:transform-[translateX(100%)]",
            position === "left" &&
              "transform-[translateX(var(--drawer-swipe-movement-x))] border-e border-border data-ending-style:transform-[translateX(-100%)] data-starting-style:transform-[translateX(-100%)]",
            position === "bottom" &&
              "transform-[translateY(var(--drawer-swipe-movement-y))] max-h-[85dvh] w-full rounded-t-xl border-t border-border data-ending-style:transform-[translateY(100%)] data-starting-style:transform-[translateY(100%)]",
            position === "top" &&
              "transform-[translateY(var(--drawer-swipe-movement-y))] max-h-[85dvh] w-full rounded-b-xl border-b border-border data-ending-style:transform-[translateY(-100%)] data-starting-style:transform-[translateY(-100%)]",
            className,
          )}
          data-slot="easy-drawer-popup"
          {...props}
          onPointerDown={(event) => {
            onPointerDown?.(event);
            if (!canStartDrawerSwipe(event.target)) event.stopPropagation();
          }}
          onTouchStart={(event) => {
            onTouchStart?.(event);
            if (!canStartDrawerSwipe(event.target)) event.stopPropagation();
          }}
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
      data-drawer-swipe-handle=""
      {...props}
    />
  );
}

export function EasyDrawerBody({
  className,
  children,
  scrollFade = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  scrollFade?: boolean;
}): React.ReactElement {
  return (
    <ScrollArea className="min-h-0 flex-1 touch-auto" data-base-ui-swipe-ignore="" scrollFade={scrollFade}>
      <div
        className={cn(
          "px-6 pt-5 pb-8 text-sm",
          className,
        )}
        data-slot="easy-drawer-body"
        data-base-ui-swipe-ignore=""
        {...props}
      >
        {children}
      </div>
    </ScrollArea>
  );
}

export function EasyDrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        "sticky inset-x-0 bottom-0 z-10 flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-6 py-3 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      data-slot="easy-drawer-footer"
      data-base-ui-swipe-ignore=""
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
  closeOnSwipe?: boolean;
  scrollFade?: boolean;
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
  closeOnSwipe,
  scrollFade = true,
  ...props
}: EasyDrawerProps): React.ReactElement {
  return (
    <EasyDrawerRoot
      position={position}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
      closeOnSwipe={closeOnSwipe}
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
              <EasyDrawerTitle className="text-lg font-semibold leading-6 tracking-tight text-foreground">
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
        <EasyDrawerBody scrollFade={scrollFade}>{children}</EasyDrawerBody>
        {footer && <EasyDrawerFooter>{footer}</EasyDrawerFooter>}
      </EasyDrawerPopup>
    </EasyDrawerRoot>
  );
}

export { DrawerPrimitive as EasyDrawerPrimitive };
