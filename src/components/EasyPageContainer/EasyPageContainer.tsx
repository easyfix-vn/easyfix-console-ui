import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EasyPageContainerProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
};

export function EasyPageContainer({
  children,
  className,
  header,
  footer,
  contentClassName,
}: EasyPageContainerProps): React.ReactElement {
  return (
    <section className={cn("w-full space-y-6", className)}>
      {header && <div data-slot="easy-page-header">{header}</div>}
      <div className={cn("space-y-6", contentClassName)}>{children}</div>
      {footer && <div data-slot="easy-page-footer">{footer}</div>}
    </section>
  );
}
