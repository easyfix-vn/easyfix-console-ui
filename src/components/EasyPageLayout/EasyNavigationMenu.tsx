"use client";

import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { ChevronRight, Search } from "lucide-react";
import { useEasyT } from "../../i18n";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";

export type EasyNavigationMenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  children?: EasyNavigationMenuItem[];
};

export type EasyNavigationMenuProps = {
  items: EasyNavigationMenuItem[];
  activeKey?: string;
  onSelect: (key: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  label?: string;
  searchable?: boolean;
  filterPlaceholder?: string;
  emptyContent?: ReactNode;
  className?: string;
};

function filterItems(items: EasyNavigationMenuItem[], query: string): EasyNavigationMenuItem[] {
  if (!query) return items;
  return items.flatMap((item) => {
    if (item.label.toLocaleLowerCase().includes(query)) return [item];
    const children = item.children ? filterItems(item.children, query) : [];
    return children.length ? [{ ...item, children }] : [];
  });
}

function getActiveAncestors(items: EasyNavigationMenuItem[], activeKey?: string): Set<string> {
  const ancestors = new Set<string>();
  function visit(nodes: EasyNavigationMenuItem[], parents: string[]) {
    nodes.forEach((item) => {
      if (item.key === activeKey) parents.forEach((key) => ancestors.add(key));
      if (item.children) visit(item.children, [...parents, item.key]);
    });
  }
  visit(items, []);
  return ancestors;
}

/** 可递归的侧边菜单；父项展开分组，叶项触发 onSelect。 */
export function EasyNavigationMenu({ items, activeKey, onSelect, header, footer, label, searchable = true, filterPlaceholder, emptyContent, className }: EasyNavigationMenuProps): ReactElement {
  const t = useEasyT();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filteredExpanded, setFilteredExpanded] = useState<{ query: string; values: Record<string, boolean> }>({ query: "", values: {} });
  const normalizedQuery = searchable ? query.trim().toLocaleLowerCase() : "";
  const visibleItems = useMemo(() => filterItems(items, normalizedQuery), [items, normalizedQuery]);
  const activeAncestors = useMemo(() => getActiveAncestors(items, activeKey), [items, activeKey]);
  const overrides = normalizedQuery ? filteredExpanded.query === normalizedQuery ? filteredExpanded.values : {} : expanded;

  function changeExpanded(key: string, open: boolean) {
    if (normalizedQuery) {
      setFilteredExpanded({ query: normalizedQuery, values: { ...overrides, [key]: open } });
    } else {
      setExpanded((previous) => ({ ...previous, [key]: open }));
    }
  }

  function renderItems(nodes: EasyNavigationMenuItem[], nested = false, parentDisabled = false): ReactNode {
    return (
      <ul className={cn("space-y-0.5", nested && "ml-3 border-l border-border pl-2")}>
        {nodes.map((item) => {
          const disabled = parentDisabled || item.disabled;
          const selected = item.key === activeKey;
          const hasChildren = Boolean(item.children?.length);
          const open = overrides[item.key] ?? (Boolean(normalizedQuery) || activeAncestors.has(item.key));
          const button = (
            <Button variant={selected ? "secondary" : "ghost"} disabled={disabled} title={item.label} aria-current={selected ? "page" : undefined} className={cn("h-8 w-full min-w-0 justify-start gap-2 rounded-md px-2 text-xs font-normal sm:h-8 sm:text-xs", (selected || activeAncestors.has(item.key)) && "font-medium text-primary")} onClick={hasChildren ? undefined : () => onSelect(item.key)}>
              {item.icon != null && <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-3.5">{item.icon}</span>}
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
              {item.badge != null && <span className="shrink-0 text-[10px]">{item.badge}</span>}
              {hasChildren && <ChevronRight aria-hidden="true" className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")} />}
            </Button>
          );
          return (
            <li key={item.key}>
              {hasChildren ? (
                <Collapsible open={open} onOpenChange={(nextOpen) => changeExpanded(item.key, nextOpen)}>
                  <CollapsibleTrigger render={button} disabled={disabled} />
                  <CollapsiblePanel>{renderItems(item.children ?? [], true, disabled)}</CollapsiblePanel>
                </Collapsible>
              ) : button}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <nav aria-label={label ?? t("pageLayout.navigation")} className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col", className)} data-slot="easy-navigation-menu">
      {header != null && <div className="shrink-0 border-b px-3 py-2">{header}</div>}
      {searchable && <div className="relative shrink-0 px-2 py-2"><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input size="sm" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={filterPlaceholder ?? t("actions.search")} placeholder={filterPlaceholder ?? t("actions.search")} inputClassName="pl-7 text-xs" /></div>}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {visibleItems.length ? renderItems(visibleItems) : <div role="status" className="px-2 py-5 text-center text-xs text-muted-foreground">{emptyContent ?? t("searchTable.empty")}</div>}
      </div>
      {footer != null && <div className="mt-auto shrink-0 border-t px-3 py-2">{footer}</div>}
    </nav>
  );
}
