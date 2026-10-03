import { useId, type ReactElement, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type EasyContextPanelProps = {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** 侧栏内的紧凑信息分区，内容及业务操作由宿主组合。 */
export function EasyContextPanel({ title, actions, children, footer, className }: EasyContextPanelProps): ReactElement {
  const titleId = useId();
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col border-b border-border", className)} aria-labelledby={titleId} data-slot="easy-context-panel">
      <header className="flex min-h-9 shrink-0 items-center justify-between gap-2 border-b px-3 py-1">
        <h2 id={titleId} className="min-w-0 break-words text-xs font-medium">{title}</h2>
        {actions != null && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      <div className="min-w-0 px-3 py-3 text-xs">{children}</div>
      {footer != null && <footer className="shrink-0 border-t px-3 py-2 text-xs text-muted-foreground">{footer}</footer>}
    </section>
  );
}
