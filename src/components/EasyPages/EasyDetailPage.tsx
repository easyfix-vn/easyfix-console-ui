import type { ReactElement, ReactNode } from "react";
import { EasyPageContainer } from "../EasyPageContainer/EasyPageContainer";
import { cn } from "@/lib/utils";
import { EasyPageHeader, type EasyPageMetadataProps } from "./EasyPageHeader";

export type EasyDetailPageProps = EasyPageMetadataProps & {
  summary?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
};

/** 详情正文与补充信息随可用容器宽度排列，适用于独立页面和工作台嵌入。 */
export function EasyDetailPage({
  summary,
  children,
  aside,
  footer,
  className,
  headerClassName,
  contentClassName,
  ...headerProps
}: EasyDetailPageProps): ReactElement {
  return (
    <EasyPageContainer
      className={cn("@container/easy-detail min-w-0 space-y-[var(--easy-page-gap,0.75rem)]", className)}
      contentClassName={cn("min-w-0 space-y-[var(--easy-page-gap,0.75rem)]", contentClassName)}
      header={<EasyPageHeader {...headerProps} className={headerClassName} />}
      footer={footer}
    >
      {summary != null && <div className="min-w-0" data-slot="easy-page-summary">{summary}</div>}
      <div className={cn("grid min-w-0 items-start gap-3", aside != null && "@3xl/easy-detail:grid-cols-[minmax(0,1fr)_18rem]")}>
        <div className="min-w-0 space-y-3" data-slot="easy-detail-content">{children}</div>
        {aside != null && <aside className="min-w-0 space-y-3" data-slot="easy-detail-aside">{aside}</aside>}
      </div>
    </EasyPageContainer>
  );
}
