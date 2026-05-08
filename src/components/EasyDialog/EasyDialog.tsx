"use client";

import type React from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogPortal,
  DialogPrimitive,
  DialogTitle,
  DialogTrigger,
  DialogViewport,
} from "@/components/ui/dialog";
import { EasyButton } from "@/components/EasyButton";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

export type EasyDialogSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClassMap: Record<EasyDialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
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
  showCloseButton = true,
  children,
  ...props
}: DialogPrimitive.Popup.Props & {
  size?: EasyDialogSize;
  showCloseButton?: boolean;
}): React.ReactElement {
  const sizeClass = sizeClassMap[size] ?? sizeClassMap.md;
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogViewport>
        <DialogPrimitive.Popup
          className={cn(
            "relative row-start-2 flex max-h-full min-h-0 w-full min-w-0 origin-center flex-col rounded-2xl border bg-popover not-dark:bg-clip-padding text-popover-foreground opacity-[calc(1-var(--nested-dialogs))] shadow-lg/5 outline-none transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:opacity-0 data-starting-style:opacity-0 sm:scale-[calc(1-0.1*var(--nested-dialogs))] sm:data-ending-style:scale-98 sm:data-starting-style:scale-98 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
            sizeClass,
            className,
          )}
          data-slot="easy-dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogClose
              render={
                <EasyButton
                  aria-label="Close dialog"
                  className="absolute end-2 top-2"
                  size="icon-xs"
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                </EasyButton>
              }
            />
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
      className={cn("space-y-1.5 px-6 pt-5 pb-4 pr-12", className)}
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
      className={cn("min-h-0 flex-1 overflow-auto px-6", className)}
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
        "flex flex-col-reverse gap-2 border-t bg-muted/40 px-6 py-3 sm:flex-row sm:justify-end sm:rounded-b-[calc(var(--radius-2xl)-1px)]",
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
      className={cn("font-heading font-semibold text-xl leading-none", className)}
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
      className={cn("text-muted-foreground text-sm", className)}
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
