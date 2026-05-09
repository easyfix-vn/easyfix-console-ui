"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CopyableText,
  type CopyableTextProps,
} from "@/components/ui/copyable-text";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * DataList — 键值对列表，参考 Radix Themes DataList 设计。
 *
 * 提供：
 *  - DataList 容器：orientation / size / labelMinWidth
 *  - DataListItem 行容器：align
 *  - DataListLabel：默认 truncate + 溢出时自动 Tooltip 显示完整
 *  - DataListValue：可选 collapsible（多行折叠）+ copyable（一键复制按钮）
 */

export type DataListOrientation = "horizontal" | "vertical";
export type DataListSize = "1" | "2" | "3";

const SIZE_TEXT: Record<DataListSize, string> = {
  "1": "text-xs",
  "2": "text-sm",
  "3": "text-base",
};

const SIZE_GAP: Record<DataListSize, string> = {
  "1": "gap-y-1.5",
  "2": "gap-y-2.5",
  "3": "gap-y-3.5",
};

type DataListContextValue = {
  orientation: DataListOrientation;
  size: DataListSize;
  labelMinWidth?: number | string;
  labelMaxWidth?: number | string;
};

const DataListContext = React.createContext<DataListContextValue>({
  orientation: "horizontal",
  size: "2",
});

/* ------------------------------------------------------------------ */
/* useIsOverflow — 监听元素是否溢出（宽 / 高）                         */
/* ------------------------------------------------------------------ */

function useIsOverflow<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  boolean,
] {
  const ref = React.useRef<T | null>(null);
  const [overflow, setOverflow] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => {
      // 1px 容差，避免 sub-pixel 抖动误判
      setOverflow(
        el.scrollWidth - el.clientWidth > 1 ||
          el.scrollHeight - el.clientHeight > 1,
      );
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, overflow];
}

/* ------------------------------------------------------------------ */
/* DataList 容器                                                       */
/* ------------------------------------------------------------------ */

export type DataListProps = React.HTMLAttributes<HTMLDListElement> & {
  /** 排版方向；horizontal: Label 与 Value 水平并排（默认）；vertical: Label 在 Value 之上 */
  orientation?: DataListOrientation;
  /** 文字 / 间距尺寸（参考 Radix Themes 的 1/2/3 级别） */
  size?: DataListSize;
  /**
   * 仅 horizontal 模式生效：限制所有 item 的 Label 列最小宽度，
   * 便于不同长度的 label 在视觉上对齐。
   */
  labelMinWidth?: number | string;
  /**
   * 仅 horizontal 模式生效：限制所有 item 的 Label 列最大宽度，超出后 truncate 并通过 Tooltip 展示。
   * 默认 "40%"（容器宽度的 40%）。传 "none" 可关闭约束。
   */
  labelMaxWidth?: number | string;
};

export const DataList = React.forwardRef<HTMLDListElement, DataListProps>(
  function DataList(
    {
      className,
      orientation = "horizontal",
      size = "2",
      labelMinWidth,
      labelMaxWidth,
      children,
      ...props
    },
    ref,
  ) {
    const value = React.useMemo<DataListContextValue>(
      () => ({ orientation, size, labelMinWidth, labelMaxWidth }),
      [orientation, size, labelMinWidth, labelMaxWidth],
    );
    return (
      <DataListContext.Provider value={value}>
        <dl
          ref={ref}
          className={cn(
            "flex flex-col",
            SIZE_TEXT[size],
            SIZE_GAP[size],
            className,
          )}
          data-orientation={orientation}
          data-slot="data-list"
          data-size={size}
          {...props}
        >
          {children}
        </dl>
      </DataListContext.Provider>
    );
  },
);

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

function toCssLen(
  val: number | string | undefined,
  fallback: string,
): string {
  if (val == null || val === "none") return fallback;
  return typeof val === "number" ? `${val}px` : val;
}

/* ------------------------------------------------------------------ */
/* DataListItem 行容器                                                 */
/* ------------------------------------------------------------------ */

export type DataListItemProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "baseline" | "stretch";
};

const ALIGN: Record<NonNullable<DataListItemProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

export const DataListItem = React.forwardRef<HTMLDivElement, DataListItemProps>(
  function DataListItem(
    { className, align = "baseline", children, style, ...props },
    ref,
  ) {
    const { orientation, labelMinWidth, labelMaxWidth } =
      React.useContext(DataListContext);

    const gridStyle: React.CSSProperties | undefined =
      orientation === "horizontal"
        ? {
            gridTemplateColumns: `minmax(${toCssLen(labelMinWidth, "auto")}, ${toCssLen(labelMaxWidth, "max-content")}) minmax(0, 1fr)`,
            ...style,
          }
        : style;

    return (
      <div
        ref={ref}
        className={cn(
          orientation === "horizontal"
            ? cn("grid gap-x-4 sm:gap-x-6", ALIGN[align])
            : "flex flex-col gap-1",
          className,
        )}
        style={gridStyle}
        data-align={align}
        data-slot="data-list-item"
        {...props}
      >
        {children}
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* DataListLabel — 单行 truncate + 溢出时显示 Tooltip                  */
/* ------------------------------------------------------------------ */

export type DataListLabelProps = React.HTMLAttributes<HTMLElement> & {
  /** 单独覆盖该 item 的 Label 列最小宽度 */
  minWidth?: number | string;
  /** 单独覆盖该 item 的 Label 列最大宽度，超出后 truncate 并通过 Tooltip 展示 */
  maxWidth?: number | string;
  /**
   * 关闭溢出时的 Tooltip。默认 true（溢出时自动显示完整内容）。
   */
  tooltip?: boolean;
  /**
   * Tooltip 中要显示的完整内容。默认透传 children；
   * 如果 children 是非文本节点，建议显式传入用于 Tooltip 的字符串。
   */
  tooltipContent?: React.ReactNode;
};

export const DataListLabel = React.forwardRef<HTMLElement, DataListLabelProps>(
  function DataListLabel(
    {
      className,
      minWidth,
      maxWidth,
      style,
      tooltip = true,
      tooltipContent,
      children,
      ...props
    },
    ref,
  ): React.ReactElement {
    const { orientation } = React.useContext(DataListContext);
    const [overflowRef, isOverflow] = useIsOverflow<HTMLElement>();

    // 同时维护内/外两个 ref（外部传入的 forwardRef + 内部 overflow 检测）
    const setRef = React.useCallback(
      (node: HTMLElement | null) => {
        (overflowRef as React.MutableRefObject<HTMLElement | null>).current =
          node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<unknown>).current = node;
      },
      [overflowRef, ref],
    );

    const styleWithMinWidth: React.CSSProperties = {
      ...(orientation === "horizontal" && minWidth != null
        ? { minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }
        : null),
      ...(orientation === "horizontal" && maxWidth != null && maxWidth !== "none"
        ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }
        : null),
      ...style,
    };

    const dt = (
      <dt
        ref={setRef as React.Ref<HTMLElement>}
        className={cn(
          "min-w-0 truncate font-medium text-muted-foreground",
          className,
        )}
        data-slot="data-list-label"
        style={styleWithMinWidth}
        {...props}
      >
        {children}
      </dt>
    );

    if (!tooltip) return dt;

    return (
      <Tooltip disabled={!isOverflow}>
        <TooltipTrigger render={dt} />
        <TooltipPopup side="top">{tooltipContent ?? children}</TooltipPopup>
      </Tooltip>
    );
  },
);

/* ------------------------------------------------------------------ */
/* DataListValue — 可折叠 + 可复制                                     */
/* ------------------------------------------------------------------ */

export type DataListValueCollapsible = boolean | { lines?: number };

export type DataListValueCopyable =
  | boolean
  | (Partial<Omit<CopyableTextProps, "value" | "children">> & {
      /** 自定义复制内容；不传时使用 children 的字符串表示 */
      value?: string;
    });

export type DataListValueProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * 当内容超过指定行数时显示「展开/收起」按钮。
   * - true：默认 2 行折叠
   * - { lines: 3 }：自定义折叠行数
   */
  collapsible?: DataListValueCollapsible;
  /**
   * 在末尾追加一个复用 CopyableText 的复制按钮。
   * - true：复制 children 的文本
   * - { value: '...', copyTooltip: '...' }：自定义复制内容/按钮属性
   */
  copyable?: DataListValueCopyable;
};

function nodeToString(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return nodeToString(props.children);
  }
  return "";
}

export const DataListValue = React.forwardRef<HTMLElement, DataListValueProps>(
  function DataListValue(
    { className, children, collapsible, copyable, ...props },
    ref,
  ): React.ReactElement {
    const collapseLines =
      collapsible && typeof collapsible === "object" && collapsible.lines
        ? collapsible.lines
        : 2;
    const collapsibleEnabled = !!collapsible;

    const [expanded, setExpanded] = React.useState(false);
    const [contentRef, isOverflow] = useIsOverflow<HTMLDivElement>();

    // 仅当折叠开启 & 内容溢出时显示「展开/收起」
    const showToggle = collapsibleEnabled && (isOverflow || expanded);

    const collapsedStyle: React.CSSProperties | undefined = collapsibleEnabled
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: expanded ? "unset" : collapseLines,
          overflow: expanded ? "visible" : "hidden",
          wordBreak: "break-word",
        }
      : undefined;

    // 复制按钮：解析 children 为字符串作为默认 value
    const copyConfig =
      copyable === true
        ? ({} as Partial<CopyableTextProps>)
        : copyable && typeof copyable === "object"
          ? copyable
          : null;
    const copyValue =
      copyConfig?.value ??
      (typeof children === "string" || typeof children === "number"
        ? String(children)
        : nodeToString(children));

    return (
      <dd
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          "min-w-0 text-foreground",
          copyConfig && "group/data-list-value flex items-start gap-1.5",
          className,
        )}
        data-slot="data-list-value"
        {...props}
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={contentRef as React.Ref<HTMLDivElement>}
            className="min-w-0"
            style={collapsedStyle}
          >
            {children}
          </div>
          {showToggle && (
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:underline"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  收起 <ChevronUpIcon className="size-3" />
                </>
              ) : (
                <>
                  展开 <ChevronDownIcon className="size-3" />
                </>
              )}
            </button>
          )}
        </div>
        {copyConfig && copyValue ? (
          <CopyableText
            value={copyValue}
            iconOnly
            size="sm"
            className="shrink-0"
            {...copyConfig}
          />
        ) : null}
      </dd>
    );
  },
);
