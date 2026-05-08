import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EasyTreeNode = {
  id: string;
  label: ReactNode;
  children?: EasyTreeNode[];
  disabled?: boolean;
  className?: string;
  data?: unknown;
};

export type EasyTreeSelectPanelProps = {
  treeData: EasyTreeNode[];
  selected?: string;
  onSelect?: (node: EasyTreeNode) => void;
  searchActions?: ReactNode;
  actions?: ReactNode;
  empty?: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  treeClassName?: string;
  renderItem?: (node: EasyTreeNode, state: EasyTreeRenderState) => ReactNode;
};

export type EasyTreeRenderState = {
  depth: number;
  expanded: boolean;
  selected: boolean;
  hasChildren: boolean;
  toggle: () => void;
};

function collectInitialExpanded(nodes: EasyTreeNode[]): Set<string> {
  const ids = new Set<string>();

  function walk(items: EasyTreeNode[]) {
    items.forEach((item) => {
      if (item.children?.length) {
        ids.add(item.id);
        walk(item.children);
      }
    });
  }

  walk(nodes);
  return ids;
}

export function EasyTreeSelectPanel({
  treeData,
  selected,
  onSelect,
  searchActions,
  actions,
  empty = "No data",
  className,
  leftClassName,
  rightClassName,
  treeClassName,
  renderItem,
}: EasyTreeSelectPanelProps): React.ReactElement {
  const initialExpanded = useMemo(() => collectInitialExpanded(treeData), [treeData]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);

  function toggleNode(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderNode(node: EasyTreeNode, depth: number): React.ReactElement {
    const hasChildren = Boolean(node.children?.length);
    const expanded = expandedIds.has(node.id);
    const isSelected = selected === node.id;
    const state: EasyTreeRenderState = {
      depth,
      expanded,
      hasChildren,
      selected: isSelected,
      toggle: () => toggleNode(node.id),
    };

    return (
      <li key={node.id} className="space-y-1">
        <div
          className={cn(
            "flex min-h-8 items-center gap-1 rounded-md px-2 text-sm transition-colors",
            node.disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-accent",
            isSelected && "bg-primary/10 text-primary",
            node.className,
          )}
          data-selected={isSelected || undefined}
          data-slot="easy-tree-item"
          onClick={() => {
            if (!node.disabled) onSelect?.(node);
          }}
          style={{ paddingLeft: `calc(0.5rem + ${depth} * 1rem)` }}
        >
          <button
            aria-label={expanded ? "Collapse" : "Expand"}
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded text-muted-foreground",
              !hasChildren && "invisible",
            )}
            onClick={(event) => {
              event.stopPropagation();
              if (hasChildren) toggleNode(node.id);
            }}
            type="button"
          >
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            {renderItem ? renderItem(node, state) : node.label}
          </div>
        </div>
        {hasChildren && expanded && (
          <ul className="space-y-1">
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div
      className={cn(
        "grid min-h-[420px] grid-cols-1 overflow-hidden rounded-xl border border-border bg-background md:grid-cols-[280px_1fr]",
        className,
      )}
      data-slot="easy-tree-select-panel"
    >
      <aside
        className={cn(
          "flex min-h-0 flex-col border-b border-border bg-muted/30 md:border-b-0 md:border-r",
          leftClassName,
        )}
      >
        {searchActions && (
          <div className="border-b border-border p-3" data-slot="easy-tree-search-actions">
            {searchActions}
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-auto p-3", treeClassName)}>
          {treeData.length ? (
            <ul className="space-y-1">{treeData.map((node) => renderNode(node, 0))}</ul>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              {empty}
            </div>
          )}
        </div>
      </aside>
      <section className={cn("min-h-0 overflow-auto p-4", rightClassName)}>
        {actions}
      </section>
    </div>
  );
}
