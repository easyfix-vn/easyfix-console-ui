"use client";

import type React from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPortal,
  DialogPrimitive,
  DialogTrigger,
  DialogViewport,
  type DialogWidth,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

export type EasyDialogSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClassMap: Record<EasyDialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-full",
};

export function EasyDialogRoot(
  props: DialogPrimitive.Root.Props,
): React.ReactElement {
  return <Dialog {...props} />;
}

export const EasyDialogTrigger = DialogTrigger;
export const EasyDialogClose = DialogClose;

export function EasyDialogPopup({
  className,
  size = "md",
  width,
  showCloseButton = true,
  children,
  ...props
}: DialogPrimitive.Popup.Props & {
  size?: EasyDialogSize;
  /** 自定义宽度，优先于 size。可传预设值或任意 CSS 值如 "600px" */
  width?: DialogWidth;
  showCloseButton?: boolean;
}): React.ReactElement {
  const sizeClass = width ? undefined : (sizeClassMap[size] ?? sizeClassMap.md);
  const widthStyle = width ? { maxWidth: width } : undefined;
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogViewport>
        <DialogPrimitive.Popup
          className={cn(
            "relative row-start-2 flex max-h-full min-h-0 w-full min-w-0 origin-center flex-col rounded-xl border border-border bg-background text-foreground shadow-lg outline-none transition-[scale,opacity,translate] duration-200 ease-out will-change-transform data-ending-style:opacity-0 data-starting-style:opacity-0 sm:scale-[calc(1-0.04*var(--nested-dialogs))] sm:data-ending-style:scale-95 sm:data-starting-style:scale-95",
            sizeClass,
            className,
          )}
          data-slot="easy-dialog-popup"
          style={widthStyle}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogClose
              aria-label="Close dialog"
              className="absolute end-3 top-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </DialogClose>
          )}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  );
}

export function EasyDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        // 留出关闭按钮位置（end-12），底部分隔线统一视觉
        "flex flex-col gap-1.5 border-b border-border px-6 py-4 pe-12",
        className,
      )}
      data-slot="easy-dialog-header"
      {...props}
    />
  );
}

export function EasyDialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-auto px-6 py-5 text-sm", className)}
      data-slot="easy-dialog-body"
      {...props}
    />
  );
}

export function EasyDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        // 标准对话框底部按钮区：右对齐、统一边距，无背景色减少视觉压力
        "flex flex-col-reverse gap-2 border-t border-border px-6 py-3 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      data-slot="easy-dialog-footer"
      {...props}
    />
  );
}

export function EasyDialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props): React.ReactElement {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-heading text-lg font-semibold leading-none tracking-tight text-foreground",
        className,
      )}
      data-slot="easy-dialog-title"
      {...props}
    />
  );
}

export function EasyDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.ReactElement {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="easy-dialog-description"
      {...props}
    />
  );
}

export type EasyDialogProps = DialogPrimitive.Root.Props & {
  trigger?: React.ReactElement;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: EasyDialogSize;
  /** 自定义宽度，优先于 size。可传预设值或任意 CSS 值如 "600px" */
  width?: DialogWidth;
  contentClassName?: string;
  showCloseButton?: boolean;
};

export function EasyDialog({
  trigger,
  title,
  description,
  footer,
  children,
  size = "md",
  width,
  contentClassName,
  showCloseButton = true,
  ...props
}: EasyDialogProps): React.ReactElement {
  return (
    <EasyDialogRoot {...props}>
      {trigger && <EasyDialogTrigger render={trigger} />}
      <EasyDialogPopup
        className={contentClassName}
        showCloseButton={showCloseButton}
        size={size}
        width={width}
      >
        {(title || description) && (
          <EasyDialogHeader>
            {title && <EasyDialogTitle>{title}</EasyDialogTitle>}
            {description && (
              <EasyDialogDescription>{description}</EasyDialogDescription>
            )}
          </EasyDialogHeader>
        )}
        <EasyDialogBody>{children}</EasyDialogBody>
        {footer && <EasyDialogFooter>{footer}</EasyDialogFooter>}
      </EasyDialogPopup>
    </EasyDialogRoot>
  );
}

export { DialogPrimitive as EasyDialogPrimitive };
