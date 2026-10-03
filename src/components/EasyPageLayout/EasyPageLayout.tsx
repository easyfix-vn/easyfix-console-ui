"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { PanelLeft, PanelRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";

export type EasyPageLayoutProps = ComponentPropsWithoutRef<"div"> & {
  /** 应用图标导航，窄屏仍保持在最左侧。 */
  rail?: ReactNode;
  sidebar?: ReactNode;
  /** 工作区页签或工具栏。 */
  header?: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  railLabel?: string;
  sidebarLabel?: string;
  asideLabel?: string;
  contentLabel?: string;
  contentAs?: "main" | "div";
  contentClassName?: string;
  density?: "compact" | "comfortable";
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  asideOpen?: boolean;
  defaultAsideOpen?: boolean;
  onAsideOpenChange?: (open: boolean) => void;
  railWidth?: number | string;
  sidebarWidth?: number | string;
  asideWidth?: number | string;
};

/** 路由无关的应用骨架。导航、页签和业务上下文通过插槽自由组合。 */
export function EasyPageLayout({
  rail, sidebar, header, aside, footer, children,
  railLabel, sidebarLabel, asideLabel, contentLabel,
  contentAs: Content = "main", contentClassName, className, style, onKeyDown,
  density = "compact", sidebarCollapsed: controlledCollapsed, defaultSidebarCollapsed = false,
  onSidebarCollapsedChange, asideOpen: controlledAsideOpen, defaultAsideOpen = true, onAsideOpenChange,
  railWidth = 48, sidebarWidth = 240, asideWidth = 280, ...props
}: EasyPageLayoutProps): React.ReactElement {
  const t = useEasyT();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [internalCollapsed, setCollapsed] = useState(defaultSidebarCollapsed);
  const [internalAsideOpen, setAsideOpen] = useState(defaultAsideOpen);
  const [activePanel, setActivePanel] = useState<"sidebar" | "aside" | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const asideToggleRef = useRef<HTMLButtonElement>(null);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const asideOpen = controlledAsideOpen ?? internalAsideOpen;
  const hasRail = rail != null && rail !== false;
  const hasSidebar = sidebar != null && sidebar !== false;
  const hasAside = aside != null && aside !== false;
  const hasHeader = header != null && header !== false;
  const hasFooter = footer != null && footer !== false;
  const sidebarName = sidebarLabel ?? t("pageLayout.navigation");
  const asideName = asideLabel ?? t("pageLayout.context");
  const sidebarExpanded = width >= 768 ? !collapsed : activePanel === "sidebar";
  const asideExpanded = width >= 1280 ? asideOpen : activePanel === "aside";
  const cssSize = (value: number | string) => typeof value === "number" ? `${value}px` : value;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      const computed = getComputedStyle(root);
      setWidth(root.clientWidth - parseFloat(computed.paddingLeft || "0") - parseFloat(computed.paddingRight || "0"));
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(([entry]) => {
        if (entry) setWidth(entry.contentRect.width);
      });
      observer.observe(root);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!activePanel) return;
    if ((activePanel === "sidebar" && (!hasSidebar || width >= 768)) ||
        (activePanel === "aside" && (!hasAside || width >= 1280))) {
      setActivePanel(null);
      return;
    }
    const panel = activePanel === "sidebar" ? sidebarRef.current : asideRef.current;
    panel?.focus({ preventScroll: true });
  }, [activePanel, hasSidebar, hasAside, width]);

  function closePanel() {
    const toggle = activePanel === "sidebar" ? sidebarToggleRef.current : asideToggleRef.current;
    setActivePanel(null);
    toggle?.focus({ preventScroll: true });
  }

  function togglePanel(panel: "sidebar" | "aside") {
    if (panel === "sidebar" && width >= 768) {
      setCollapsed(!collapsed);
      onSidebarCollapsedChange?.(!collapsed);
      return;
    }
    if (panel === "aside" && width >= 1280) {
      setAsideOpen(!asideOpen);
      onAsideOpenChange?.(!asideOpen);
      return;
    }
    if (activePanel === panel) closePanel();
    else setActivePanel(panel);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Escape" || !activePanel) return;
    if ((activePanel === "sidebar" && width >= 768) || (activePanel === "aside" && width >= 1280)) return;
    event.preventDefault();
    closePanel();
  }

  function panelHeading(name: string) {
    return <div className="easy-page-layout-panel-heading">
      <span className="text-xs font-medium">{name}</span>
      <Button variant="ghost" size="icon-xs" aria-label={t("pageLayout.closePanel", { name })} onClick={closePanel}><X /></Button>
    </div>;
  }

  return (
    <div {...props} ref={rootRef} onKeyDown={handleKeyDown} className={cn("easy-page-layout", className)}
      data-slot="easy-page-layout" data-density={density} data-sidebar-collapsed={collapsed} data-aside-open={asideOpen}
      style={{
        "--easy-page-rail-track": hasRail ? cssSize(railWidth) : "0px",
        "--easy-page-sidebar-width": cssSize(sidebarWidth),
        "--easy-page-aside-width": cssSize(asideWidth),
        "--easy-page-sidebar-track": hasSidebar && !collapsed ? "var(--easy-page-sidebar-width)" : "0px",
        "--easy-page-aside-track": hasAside && asideOpen ? "var(--easy-page-aside-width)" : "0px", ...style,
      } as CSSProperties}>
      <div className="easy-page-layout-body">
        {hasRail && <div className="easy-page-layout-rail" role="navigation" aria-label={railLabel ?? t("pageLayout.apps")} data-slot="easy-page-rail">{rail}</div>}
        {activePanel && <button className={cn("easy-page-layout-backdrop", `easy-page-layout-backdrop-${activePanel}`)} type="button" tabIndex={-1} aria-hidden="true" aria-label={t("pageLayout.closePanel", { name: activePanel === "sidebar" ? sidebarName : asideName })} onClick={closePanel} />}
        {hasSidebar && <aside ref={sidebarRef} tabIndex={-1} className="easy-page-layout-sidebar" id={`${id}-sidebar`} aria-label={sidebarName} data-open={activePanel === "sidebar"} data-slot="easy-page-sidebar">
          {panelHeading(sidebarName)}{sidebar}
        </aside>}
        <div className="easy-page-layout-workspace">
          {(hasHeader || hasSidebar || hasAside) && <div className="easy-page-layout-header" data-slot="easy-page-workspace-header">
            {hasSidebar && <Button ref={sidebarToggleRef} variant="ghost" size="icon-sm" className="mx-1 shrink-0" aria-label={sidebarName} title={sidebarName} aria-controls={`${id}-sidebar`} aria-expanded={sidebarExpanded} onClick={() => togglePanel("sidebar")}><PanelLeft /></Button>}
            <div className="min-w-0 flex-1">{header}</div>
            {hasAside && <Button ref={asideToggleRef} variant={asideExpanded ? "secondary" : "ghost"} size="icon-sm" className="mx-1 shrink-0" aria-label={asideName} title={asideName} aria-controls={`${id}-aside`} aria-expanded={asideExpanded} onClick={() => togglePanel("aside")}><PanelRight /></Button>}
          </div>}
          <Content className={cn("easy-page-layout-content", contentClassName)} role={Content === "div" ? "region" : undefined} aria-label={contentLabel ?? t("pageLayout.content")} data-slot="easy-page-content">{children}</Content>
        </div>
        {hasAside && <aside ref={asideRef} tabIndex={-1} className="easy-page-layout-aside" id={`${id}-aside`} aria-label={asideName} data-open={activePanel === "aside"} data-slot="easy-page-aside">
          {panelHeading(asideName)}{aside}
        </aside>}
      </div>
      {hasFooter && <footer className="easy-page-layout-footer" data-slot="easy-page-layout-footer">{footer}</footer>}
    </div>
  );
}
