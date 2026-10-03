import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EasyPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  className?: string;
};

/** 页面共用元数据；className 控制页面，headerClassName 单独控制页头。 */
export type EasyPageMetadataProps = Omit<EasyPageHeaderProps, "className"> & {
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

/** 标题、状态与主要操作组成页头；面包屑由调用方提供可访问的导航。 */
export function EasyPageHeader({
  title,
  description,
  breadcrumb,
  actions,
  status,
  className,
}: EasyPageHeaderProps): ReactElement {
  return (
    <header className={cn("@container/easy-page-heading min-w-0 space-y-2", className)} data-slot="easy-page-heading">
      {breadcrumb != null && <div className="min-w-0 text-xs text-muted-foreground">{breadcrumb}</div>}
      <div className="flex flex-col items-start justify-between gap-2 @lg/easy-page-heading:flex-row">
        <div className="min-w-0 w-full space-y-1 @lg/easy-page-heading:flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {status != null && <div className="flex shrink-0 items-center">{status}</div>}
          </div>
          {description != null && (
            <div className="max-w-3xl text-xs leading-5 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {actions != null && (
          <div className="flex max-w-full flex-wrap items-center gap-2" data-slot="easy-page-actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
