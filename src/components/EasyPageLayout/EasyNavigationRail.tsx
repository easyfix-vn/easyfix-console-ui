"use client";

import type { ReactElement, ReactNode } from "react";
import { useEasyT } from "../../i18n";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

export type EasyNavigationRailItem = {
  key: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
};

export type EasyNavigationRailProps = {
  items: EasyNavigationRailItem[];
  activeKey?: string;
  onSelect: (key: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  label?: string;
  className?: string;
};

/** 48px 图标导航列；只通知选中项，路由由宿主决定。 */
export function EasyNavigationRail({ items, activeKey, onSelect, header, footer, label, className }: EasyNavigationRailProps): ReactElement {
  const t = useEasyT();
  return (
    <nav aria-label={label ?? t("pageLayout.apps")} className={cn("flex h-full min-h-0 w-12 shrink-0 flex-1 flex-col items-center gap-2 py-2", className)} data-slot="easy-navigation-rail">
      {header != null && <div className="flex shrink-0 items-center justify-center pb-1">{header}</div>}
      <ul className="flex min-h-0 w-full flex-col items-center gap-1 overflow-y-auto px-1">
        {items.map((item) => (
          <li key={item.key}>
            <Tooltip>
              <TooltipTrigger render={<Button variant={activeKey === item.key ? "secondary" : "ghost"} size="icon" className={cn("size-9 rounded-md sm:size-9", activeKey === item.key && "text-primary")} aria-label={item.label} title={item.label} aria-current={activeKey === item.key ? "page" : undefined} disabled={item.disabled} onClick={() => onSelect(item.key)} />}>
                <span aria-hidden="true" className="flex items-center justify-center [&_svg]:size-4">{item.icon}</span>
              </TooltipTrigger>
              <TooltipPopup side="right">{item.label}</TooltipPopup>
            </Tooltip>
          </li>
        ))}
      </ul>
      {footer != null && <div className="mt-auto flex shrink-0 flex-col items-center gap-1 pt-2">{footer}</div>}
    </nav>
  );
}
