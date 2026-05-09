"use client";

import { CircleAlertIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
  PopoverDescription,
} from "@/components/ui/popover";

export type PopconfirmProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
};

export function Popconfirm({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "确定",
  cancelText = "取消",
  icon,
  open,
  onOpenChange,
  children,
  side = "top",
  align = "center",
  className,
}: PopconfirmProps): React.ReactElement {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverPopup
        side={side}
        align={align}
        className={cn("w-72", className)}
        sideOffset={8}
      >
        <div className="flex gap-2.5">
          <div className="mt-0.5 shrink-0 text-warning">
            {icon || <CircleAlertIcon className="size-4" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-medium text-sm">{title}</div>
            {description && (
              <PopoverDescription>{description}</PopoverDescription>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button size="xs" variant="outline" onClick={handleCancel}>
                {cancelText}
              </Button>
              <Button size="xs" onClick={handleConfirm}>
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
