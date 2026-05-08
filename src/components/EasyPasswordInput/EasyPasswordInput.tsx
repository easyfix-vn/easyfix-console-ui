"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input, type InputProps } from "@/components/ui";
import { cn } from "@/lib/utils";

export type EasyPasswordInputProps = Omit<InputProps, "onChange" | "type"> & {
  defaultVisible?: boolean;
  height?: "default" | "comfortable";
  visibilityLabel?: string;
  hiddenLabel?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  wrapperClassName?: string;
};

export const EasyPasswordInput = React.forwardRef<
  HTMLInputElement,
  EasyPasswordInputProps
>(function EasyPasswordInput(
  {
    className,
    defaultVisible = false,
    disabled,
    height = "default",
    hiddenLabel = "Hide password",
    visibilityLabel = "Show password",
    wrapperClassName,
    ...props
  },
  ref,
): React.ReactElement {
  const [visible, setVisible] = React.useState(defaultVisible);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className={cn("relative", wrapperClassName)} data-slot="easy-password-input">
      <Input
        ref={ref}
        className={cn(
          "[&_[data-slot=input]]:pr-10",
          height === "comfortable" &&
            "h-[38px] [&_[data-slot=input]]:h-full [&_[data-slot=input]]:leading-9",
          className,
        )}
        disabled={disabled}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        aria-label={visible ? hiddenLabel : visibilityLabel}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
});
