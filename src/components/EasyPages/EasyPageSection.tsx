import { useId, type ReactElement, type ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";

export type EasyPageSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** 复用 Card 的页面区块，保留 h2 标题与独立的正文插槽。 */
export function EasyPageSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: EasyPageSectionProps): ReactElement {
  const titleId = useId();

  return (
    <Card className={cn("min-w-0 rounded-lg shadow-none", className)} render={<section aria-labelledby={titleId} />}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 space-y-1.5">
          <CardTitle id={titleId} render={<h2 />} className="break-words text-sm">
            {title}
          </CardTitle>
          {description != null && <CardDescription>{description}</CardDescription>}
        </div>
        {actions != null && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardPanel className={cn("min-w-0 px-3 pb-3", contentClassName)}>{children}</CardPanel>
    </Card>
  );
}
