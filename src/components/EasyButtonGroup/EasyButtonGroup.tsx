import type React from "react";
import { cn } from "@/lib/utils";

export type EasyButtonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  attached?: boolean;
};

export function EasyButtonGroup({
  className,
  orientation = "horizontal",
  attached = false,
  ...props
}: EasyButtonGroupProps): React.ReactElement {
  return (
    <div
      className={cn(
        "inline-flex",
        orientation === "vertical" ? "flex-col" : "flex-row",
        attached
          ? orientation === "vertical"
            ? "[&>[data-slot=easy-button]:not(:first-child)]:-mt-px [&>[data-slot=easy-button]:not(:first-child)]:rounded-t-none [&>[data-slot=easy-button]:not(:last-child)]:rounded-b-none"
            : "[&>[data-slot=easy-button]:not(:first-child)]:-ml-px [&>[data-slot=easy-button]:not(:first-child)]:rounded-l-none [&>[data-slot=easy-button]:not(:last-child)]:rounded-r-none"
          : "gap-2",
        className,
      )}
      data-orientation={orientation}
      data-slot="easy-button-group"
      role="group"
      {...props}
    />
  );
}
