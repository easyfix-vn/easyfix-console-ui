"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const DialogCreateHandle: typeof DialogPrimitive.createHandle =
  DialogPrimitive.createHandle;

export type DialogProps<Payload = unknown> =
  DialogPrimitive.Root.Props<Payload> & {
    /** 点击遮罩是否关闭。默认 true */
    closeOnBackdropClick?: boolean;
    /** ESC 键是否关闭。默认 true */
    closeOnEscape?: boolean;
  };

export function Dialog<Payload = unknown>({
  closeOnBackdropClick = true,
  closeOnEscape = true,
  onOpenChange,
  ...props
}: DialogProps<Payload>): React.ReactElement {
  /*
   * - closeOnBackdropClick=false 直接转交给 base-ui 的 disablePointerDismissal
   *   该开关会同时禁止「点击遮罩」与「焦点离开」两类指针/焦点关闭路径。
   * - closeOnEscape=false 通过 onOpenChange 拦截 reason==="escape-key"
   *   的关闭意图，调用 details.cancel() 阻止默认行为。
   */
  const handleOpenChange = React.useCallback<
    NonNullable<DialogPrimitive.Root.Props<Payload>["onOpenChange"]>
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
    <DialogPrimitive.Root
      disablePointerDismissal={!closeOnBackdropClick}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

export const DialogPortal: typeof DialogPrimitive.Portal =
  DialogPrimitive.Portal;

export function DialogTrigger({
  asChild,
  children,
  render,
  ...props
}: DialogPrimitive.Trigger.Props & {
  asChild?: boolean;
}): React.ReactElement {
  const childRender =
    asChild && React.isValidElement(children) ? children : render;

  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      render={childRender}
      {...props}
    >
      {asChild ? undefined : children}
    </DialogPrimitive.Trigger>
  );
}

export function DialogClose(
  props: DialogPrimitive.Close.Props,
): React.ReactElement {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props): React.ReactElement {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      data-slot="dialog-backdrop"
      {...props}
    />
  );
}

export function DialogViewport({
  className,
  ...props
}: DialogPrimitive.Viewport.Props): React.ReactElement {
  return (
    <DialogPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50 grid grid-rows-[1fr_auto_3fr] justify-items-center p-4",
        className,
      )}
      data-slot="dialog-viewport"
      {...props}
    />
  );
}

export type DialogWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full" | (string & {});

const dialogWidthMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

export function DialogPopup({
  className,
  children,
  showCloseButton = true,
  bottomStickOnMobile = true,
  width,
  closeProps,
  portalProps,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  bottomStickOnMobile?: boolean;
  /** 对话框宽度。可传预设值 "sm" | "md" | "lg" | "xl" | "2xl" ~ "5xl" | "full"，也可传任意 CSS 宽度值如 "600px"、"80%" */
  width?: DialogWidth;
  closeProps?: DialogPrimitive.Close.Props;
  portalProps?: DialogPrimitive.Portal.Props;
}): React.ReactElement {
  const widthClass = width ? dialogWidthMap[width] : "max-w-lg";
  const widthStyle = width && !dialogWidthMap[width] ? { maxWidth: width } : undefined;

  return (
    <DialogPortal {...portalProps}>
      <DialogBackdrop />
      <DialogViewport
        className={cn(
          bottomStickOnMobile &&
            "max-sm:grid-rows-[1fr_auto] max-sm:p-0 max-sm:pt-12",
        )}
      >
        <DialogPrimitive.Popup
          className={cn(
            "relative row-start-2 flex max-h-full min-h-0 w-full min-w-0 origin-center flex-col rounded-2xl border bg-popover not-dark:bg-clip-padding text-popover-foreground opacity-[calc(1-var(--nested-dialogs))] shadow-lg/5 outline-none transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:opacity-0 data-starting-style:opacity-0 sm:scale-[calc(1-0.1*var(--nested-dialogs))] sm:data-ending-style:scale-98 sm:data-starting-style:scale-98 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
            widthClass,
            bottomStickOnMobile &&
              "max-sm:max-w-none max-sm:origin-bottom max-sm:rounded-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:translate-y-4 max-sm:before:hidden max-sm:before:rounded-none",
            className,
          )}
          data-slot="dialog-popup"
          style={widthStyle}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute end-2 top-2"
              render={<Button size="icon" variant="ghost" />}
              {...closeProps}
            >
              <XIcon />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      "flex flex-col gap-2 p-6 in-[[data-slot=dialog-popup]:has([data-slot=dialog-panel])]:pb-3 max-sm:pb-4",
      className,
    ),
    "data-slot": "dialog-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DialogFooter({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  variant?: "default" | "bare";
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      "flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end sm:rounded-b-[calc(var(--radius-2xl)-1px)]",
      variant === "default" && "border-t bg-muted/72 py-4",
      variant === "bare" &&
        "in-[[data-slot=dialog-popup]:has([data-slot=dialog-panel])]:pt-3 pt-4 pb-6",
      className,
    ),
    "data-slot": "dialog-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props): React.ReactElement {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-heading font-semibold text-xl leading-none",
        className,
      )}
      data-slot="dialog-title"
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.ReactElement {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

export function DialogPanel({
  className,
  scrollFade = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  scrollFade?: boolean;
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      "p-6 in-[[data-slot=dialog-popup]:has([data-slot=dialog-header])]:pt-1 in-[[data-slot=dialog-popup]:has([data-slot=dialog-footer]:not(.border-t))]:pb-1",
      className,
    ),
    "data-slot": "dialog-panel",
  };

  return (
    <ScrollArea scrollFade={scrollFade}>
      {useRender({
        defaultTagName: "div",
        props: mergeProps<"div">(defaultProps, props),
        render,
      })}
    </ScrollArea>
  );
}

export {
  DialogPrimitive,
  DialogBackdrop as DialogOverlay,
  DialogPopup as DialogContent,
};
