"use client";

import type { ReactElement, ReactNode } from "react";
import { X } from "lucide-react";
import { useEasyT } from "../../i18n";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { EasyTabs, EasyTabsList, EasyTabsTrigger } from "../EasyTabContainer/EasyTabContainer";

export type EasyWorkspaceTabItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  closable?: boolean;
  disabled?: boolean;
};

export type EasyWorkspaceTabsProps = {
  items: EasyWorkspaceTabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onClose?: (key: string) => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  label?: string;
  closeLabel?: (item: EasyWorkspaceTabItem) => string;
  className?: string;
};

/** 受控的工作区标签栏；关闭后的活动页由宿主更新。 */
export function EasyWorkspaceTabs({ items, activeKey, onSelect, onClose, leading, trailing, label, closeLabel, className }: EasyWorkspaceTabsProps): ReactElement {
  const t = useEasyT();
  return (
    <div className={cn("flex h-9 min-w-0 shrink-0 items-center gap-1 bg-muted/30 px-1", className)} data-slot="easy-workspace-tabs">
      {leading != null && <div className="flex shrink-0 items-center">{leading}</div>}
      <EasyTabs value={activeKey} onValueChange={(value) => { if (value != null) onSelect(String(value)); }} className="min-w-0 flex-1">
        <EasyTabsList aria-label={label ?? t("pageLayout.navigation")} className="h-9 w-full justify-start gap-1 overflow-x-auto overflow-y-hidden rounded-none bg-transparent p-0 [&>[data-slot=easy-tab-indicator]]:hidden">
          {items.map((item) => (
            <div key={item.key} className={cn("flex h-7 shrink-0 items-center rounded-md border border-transparent", item.key === activeKey ? "border-border bg-background shadow-xs" : "hover:bg-muted")}>
              <EasyTabsTrigger value={item.key} disabled={item.disabled} className={cn("h-7 gap-1.5 rounded-md px-2 text-xs font-normal sm:h-7 sm:text-xs data-active:font-medium data-active:text-primary", item.closable && onClose && "pr-1")}>
                {item.icon != null && <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-3.5">{item.icon}</span>}
                <span className="max-w-48 truncate">{item.label}</span>
              </EasyTabsTrigger>
              {item.closable && onClose && <Button size="icon-xs" variant="ghost" disabled={item.disabled} className="mr-1 size-5 rounded-sm sm:size-5" aria-label={closeLabel?.(item) ?? `${t("actions.close")} ${item.label}`} onClick={() => onClose(item.key)}><X aria-hidden="true" className="size-3" /></Button>}
            </div>
          ))}
        </EasyTabsList>
      </EasyTabs>
      {trailing != null && <div className="flex shrink-0 items-center">{trailing}</div>}
    </div>
  );
}
