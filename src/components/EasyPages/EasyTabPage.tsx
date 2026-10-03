import type { ReactElement, ReactNode } from "react";
import { EasyPageContainer } from "../EasyPageContainer/EasyPageContainer";
import { EasyTabContainer, type EasyTabContainerProps, type EasyTabItem } from "../EasyTabContainer/EasyTabContainer";
import { cn } from "@/lib/utils";
import { EasyPageHeader, type EasyPageMetadataProps } from "./EasyPageHeader";

export type EasyTabPageProps = EasyPageMetadataProps & {
  items: EasyTabItem[];
  tabsProps?: Omit<EasyTabContainerProps, "items">;
  footer?: ReactNode;
};

/** 带页面标题的导航式 Tab 页面，标签状态由 EasyTabContainer 管理。 */
export function EasyTabPage({
  items,
  tabsProps,
  footer,
  className,
  headerClassName,
  contentClassName,
  ...headerProps
}: EasyTabPageProps): ReactElement {
  return (
    <EasyPageContainer
      className={cn("min-w-0 space-y-[var(--easy-page-gap,0.75rem)]", className)}
      contentClassName={cn("min-w-0 space-y-[var(--easy-page-gap,0.75rem)]", contentClassName)}
      header={<EasyPageHeader {...headerProps} className={headerClassName} />}
      footer={footer}
    >
      <EasyTabContainer
        variant="navigation"
        {...tabsProps}
        defaultValue={tabsProps?.defaultValue ?? items.find((item) => !item.disabled)?.value}
        items={items}
        className={cn("min-w-0 gap-3", tabsProps?.className)}
        listClassName={cn("min-w-0 overflow-x-auto overflow-y-hidden", tabsProps?.listClassName)}
        contentClassName={cn("min-w-0", tabsProps?.contentClassName)}
      />
    </EasyPageContainer>
  );
}
