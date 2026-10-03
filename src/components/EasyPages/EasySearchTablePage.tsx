import type { ReactElement, ReactNode } from "react";
import { EasyPageContainer } from "../EasyPageContainer/EasyPageContainer";
import { EasySearchTable, type EasySearchTableProps } from "../EasySearchTable/EasySearchTable";
import { Card, CardPanel } from "../ui/card";
import { cn } from "@/lib/utils";
import { EasyPageHeader, type EasyPageMetadataProps } from "./EasyPageHeader";

export type EasySearchTablePageProps<T extends Record<string, unknown>> = EasyPageMetadataProps & {
  summary?: ReactNode;
  tableProps: EasySearchTableProps<T>;
  footer?: ReactNode;
};

/** 搜索、分页、排序与视图切换直接复用 EasySearchTable 的能力。 */
export function EasySearchTablePage<T extends Record<string, unknown>>({
  summary,
  tableProps,
  footer,
  className,
  headerClassName,
  contentClassName,
  ...headerProps
}: EasySearchTablePageProps<T>): ReactElement {
  return (
    <EasyPageContainer
      className={cn("@container min-w-0 space-y-[var(--easy-page-gap,0.75rem)]", className)}
      contentClassName={cn("min-w-0 space-y-[var(--easy-page-gap,0.75rem)]", contentClassName)}
      header={<EasyPageHeader {...headerProps} className={headerClassName} />}
      footer={footer}
    >
      {summary != null && <div className="min-w-0" data-slot="easy-page-summary">{summary}</div>}
      <Card className="min-w-0 rounded-lg shadow-none">
        <CardPanel className="min-w-0 p-3">
          <EasySearchTable {...tableProps} />
        </CardPanel>
      </Card>
    </EasyPageContainer>
  );
}
