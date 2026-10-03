import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "@/i18n";
import { EasyPageLayout } from "./EasyPageLayout";

let contentWidth = 0;
let borderBoxWidth = 0;
let observers: Array<{ callback: ResizeObserverCallback; target: Element; disconnect: ReturnType<typeof vi.fn> }> = [];
const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

function resizeLayout(width: number, border = 0) {
  contentWidth = width;
  borderBoxWidth = width + border;
  act(() => observers.forEach(({ callback, target }) => callback(
    [{ target, contentRect: { width } } as ResizeObserverEntry],
    {} as ResizeObserver,
  )));
}

describe("EasyPageLayout", () => {
  beforeEach(() => {
    contentWidth = 0;
    borderBoxWidth = 0;
    observers = [];
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function () {
      return this.getAttribute("data-slot") === "easy-page-layout" ? contentWidth : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
      const rect = originalGetBoundingClientRect.call(this);
      return this.getAttribute("data-slot") === "easy-page-layout"
        ? { ...rect, width: borderBoxWidth, toJSON: () => ({}) }
        : rect;
    });
    vi.stubGlobal("ResizeObserver", class {
      disconnect = vi.fn();
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        observers.push({ callback: this.callback, target, disconnect: this.disconnect });
        this.callback([{ target, contentRect: { width: contentWidth } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      unobserve() {}
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("窄屏侧栏互斥展开，聚焦展开区域并在关闭后返回开关", async () => {
    const user = userEvent.setup();
    render(
      <EasyI18nProvider locale="zh-CN">
        <EasyPageLayout sidebar={<a href="#orders">工单</a>} aside={<p>当前负责人</p>}>
          <h1>工单管理</h1>
        </EasyPageLayout>
      </EasyI18nProvider>,
    );
    const navigation = screen.getByRole("button", { name: "页面导航" });
    const context = screen.getByRole("button", { name: "辅助信息" });
    const panel = document.getElementById(navigation.getAttribute("aria-controls")!);
    expect(navigation).toHaveAttribute("aria-expanded", "false");
    await user.click(navigation);
    expect(navigation).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveAttribute("data-open", "true");
    expect(panel).toHaveFocus();
    expect(context).toHaveAttribute("aria-expanded", "false");
    await user.click(context);
    expect(context).toHaveAttribute("aria-expanded", "true");
    expect(navigation).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("data-open", "false");
    await user.click(screen.getByRole("button", { name: "关闭辅助信息" }));
    expect(context).toHaveAttribute("aria-expanded", "false");
    expect(context).toHaveFocus();
  });

  it("Escape 关闭覆盖面板且不改变主体的阅读位置", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EasyI18nProvider locale="zh-CN">
        <EasyPageLayout aside="辅助内容">页面正文</EasyPageLayout>
      </EasyI18nProvider>,
    );
    const toggle = screen.getByRole("button", { name: "辅助信息" });
    vi.spyOn(toggle, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    const body = container.querySelector<HTMLDivElement>(".easy-page-layout-content")!;
    body.scrollTop = 240;
    await user.click(toggle);
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(body.scrollTop).toBe(240);
  });

  it("多个布局的侧栏 ID 独立，切换语言更新默认名称", () => {
    const renderLayouts = (locale: "en-US" | "vi") => (
      <EasyI18nProvider locale={locale}>
        <EasyPageLayout sidebar="First">One</EasyPageLayout>
        <EasyPageLayout sidebar="Second" contentAs="div">Two</EasyPageLayout>
      </EasyI18nProvider>
    );
    const { rerender } = render(renderLayouts("en-US"));
    const toggles = screen.getAllByRole("button", { name: "Page navigation" });
    expect(toggles[0].getAttribute("aria-controls")).not.toBe(toggles[1].getAttribute("aria-controls"));
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Page content" })).toHaveTextContent("Two");
    rerender(renderLayouts("vi"));
    expect(screen.getAllByRole("button", { name: "Điều hướng trang" })).toHaveLength(2);
  });

  it("不传侧栏时不渲染开关和空区域", () => {
    const { container } = render(<EasyPageLayout contentLabel="内容">Only content</EasyPageLayout>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("[data-slot='easy-page-sidebar']")).toBeNull();
    expect(container.querySelector("[data-slot='easy-page-aside']")).toBeNull();
  });

  it("桌面受控开关只报告意图，等待父级更新后才改变展开状态", async () => {
    resizeLayout(1366);
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const onAsideOpenChange = vi.fn();
    const layout = (sidebarCollapsed: boolean, asideOpen: boolean) => (
      <EasyI18nProvider locale="en-US">
        <EasyPageLayout sidebar="Navigation" aside="Context"
          sidebarCollapsed={sidebarCollapsed} asideOpen={asideOpen}
          onSidebarCollapsedChange={onSidebarCollapsedChange} onAsideOpenChange={onAsideOpenChange}>
          Content
        </EasyPageLayout>
      </EasyI18nProvider>
    );
    const { container, rerender } = render(layout(false, true));
    const navigation = screen.getByRole("button", { name: "Page navigation" });
    const context = screen.getByRole("button", { name: "Context panel" });
    const root = container.querySelector("[data-slot='easy-page-layout']")!;

    await user.click(navigation);
    await user.click(context);
    expect(onSidebarCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(onAsideOpenChange).toHaveBeenLastCalledWith(false);
    expect(navigation).toHaveAttribute("aria-expanded", "true");
    expect(context).toHaveAttribute("aria-expanded", "true");
    expect(root).toHaveAttribute("data-sidebar-collapsed", "false");
    expect(root).toHaveAttribute("data-aside-open", "true");

    rerender(layout(true, false));
    expect(navigation).toHaveAttribute("aria-expanded", "false");
    expect(context).toHaveAttribute("aria-expanded", "false");
    expect(root).toHaveStyle({ "--easy-page-sidebar-track": "0px", "--easy-page-aside-track": "0px" });
    expect(container.querySelector(".easy-page-layout-backdrop")).toBeNull();

    await user.click(navigation);
    await user.click(context);
    expect(onSidebarCollapsedChange).toHaveBeenLastCalledWith(false);
    expect(onAsideOpenChange).toHaveBeenLastCalledWith(true);
    expect(navigation).toHaveAttribute("aria-expanded", "false");
    expect(context).toHaveAttribute("aria-expanded", "false");
  });

  it.each([
    { name: "Page navigation", width: 766 },
    { name: "Context panel", width: 1278 },
  ])("$name 使用内容区宽度判断断点，不把边框计入可用空间", async ({ name, width }) => {
    resizeLayout(width, 2);
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const onAsideOpenChange = vi.fn();
    render(
      <EasyI18nProvider locale="en-US">
        <EasyPageLayout sidebar="Navigation" aside="Context"
          onSidebarCollapsedChange={onSidebarCollapsedChange} onAsideOpenChange={onAsideOpenChange}>
          Content
        </EasyPageLayout>
      </EasyI18nProvider>,
    );
    const toggle = screen.getByRole("button", { name });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toHaveAttribute("data-open", "true");
    expect(onSidebarCollapsedChange).not.toHaveBeenCalled();
    expect(onAsideOpenChange).not.toHaveBeenCalled();
  });

  it("展开的插槽被移除后同时移除遮罩和失效开关", async () => {
    const user = userEvent.setup();
    const layout = (showAside: boolean) => (
      <EasyI18nProvider locale="en-US">
        <EasyPageLayout aside={showAside ? "Context" : null}>Content</EasyPageLayout>
      </EasyI18nProvider>
    );
    const { container, rerender } = render(layout(true));
    await user.click(screen.getByRole("button", { name: "Context panel" }));
    expect(container.querySelector(".easy-page-layout-backdrop")).not.toBeNull();

    rerender(layout(false));
    expect(container.querySelector("[data-slot='easy-page-aside']")).toBeNull();
    expect(screen.queryByRole("button", { name: "Context panel" })).toBeNull();
    expect(container.querySelector(".easy-page-layout-backdrop")).toBeNull();
  });

  it.each([
    { name: "Page navigation", inlineWidth: 768 },
    { name: "Context panel", inlineWidth: 1280 },
  ])("$name 进入桌面后清理覆盖状态，回到窄屏不重新展开", async ({ name, inlineWidth }) => {
    resizeLayout(600);
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const onAsideOpenChange = vi.fn();
    const { container } = render(
      <EasyI18nProvider locale="en-US">
        <EasyPageLayout sidebar="Navigation" aside="Context" sidebarCollapsed asideOpen={false}
          onSidebarCollapsedChange={onSidebarCollapsedChange} onAsideOpenChange={onAsideOpenChange}>
          Content
        </EasyPageLayout>
      </EasyI18nProvider>,
    );
    const toggle = screen.getByRole("button", { name });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    resizeLayout(inlineWidth);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".easy-page-layout-backdrop")).toBeNull();
    resizeLayout(600);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".easy-page-layout-backdrop")).toBeNull();
    expect(onSidebarCollapsedChange).not.toHaveBeenCalled();
    expect(onAsideOpenChange).not.toHaveBeenCalled();
  });

  it("false 条件插槽不会留下空栏位和控制按钮", () => {
    const { container } = render(
      <EasyPageLayout rail={false} sidebar={false} aside={false} header={false} footer={false}>Content</EasyPageLayout>,
    );
    expect(screen.getByRole("main")).toHaveTextContent("Content");
    expect(screen.queryByRole("button")).toBeNull();
    for (const slot of ["easy-page-rail", "easy-page-sidebar", "easy-page-aside", "easy-page-workspace-header", "easy-page-layout-footer"]) {
      expect(container.querySelector(`[data-slot='${slot}']`)).toBeNull();
    }
  });

  it("子控件消费 Escape 时保留覆盖栏，未消费时关闭", async () => {
    const user = userEvent.setup();
    render(
      <EasyI18nProvider locale="en-US">
        <EasyPageLayout aside={<input aria-label="Panel field" onKeyDown={(event) => event.preventDefault()} />}>Content</EasyPageLayout>
      </EasyI18nProvider>,
    );
    const toggle = screen.getByRole("button", { name: "Context panel" });
    await user.click(toggle);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Panel field" }), { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document.getElementById(toggle.getAttribute("aria-controls")!)!, { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("卸载后解除容器尺寸观察", () => {
    const { unmount } = render(<EasyPageLayout>Content</EasyPageLayout>);
    expect(observers).toHaveLength(1);
    const { disconnect } = observers[0];
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("不支持 ResizeObserver 时使用内容宽度并清理 resize 监听", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    resizeLayout(1366, 2);
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <EasyI18nProvider locale="en-US"><EasyPageLayout aside="Context">Content</EasyPageLayout></EasyI18nProvider>,
    );
    const toggle = screen.getByRole("button", { name: "Context panel" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    resizeLayout(1278, 2);
    fireEvent(window, new Event("resize"));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const resizeListener = addListener.mock.calls.find(([name]) => name === "resize")?.[1];
    expect(resizeListener).toEqual(expect.any(Function));
    unmount();
    expect(removeListener).toHaveBeenCalledWith("resize", resizeListener);
  });
});
