"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { EasyInput, type EasyInputProps } from "@/components/EasyInput";

export type EasyPasswordInputProps = Omit<EasyInputProps, "type" | "suffix"> & {
  /** 默认是否可见 */
  defaultVisible?: boolean;
  /** 切换可见时显示的辅助文本（aria-label） */
  visibilityLabel?: string;
  /** 切换隐藏时显示的辅助文本（aria-label） */
  hiddenLabel?: string;
  /** 自定义额外的 suffix 内容（追加在显示/隐藏图标之后） */
  extraSuffix?: React.ReactNode;
};

/**
 * 密码输入框：基于 EasyInput 复用 prefix / allowClear / showCount 等能力，
 * 在 suffix 中固定显示 显示/隐藏 切换按钮。
 */
export const EasyPasswordInput = React.forwardRef<
  HTMLInputElement,
  EasyPasswordInputProps
>(function EasyPasswordInput(
  {
    defaultVisible = false,
    disabled,
    hiddenLabel = "Hide password",
    visibilityLabel = "Show password",
    extraSuffix,
    ...props
  },
  ref,
) {
  const [visible, setVisible] = React.useState(defaultVisible);
  const Icon = visible ? EyeOff : Eye;

  const visibilityToggle = (
    <button
      aria-label={visible ? hiddenLabel : visibilityLabel}
      aria-pressed={visible}
      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={() => setVisible((current) => !current)}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );

  return (
    <EasyInput
      ref={ref}
      type={visible ? "text" : "password"}
      disabled={disabled}
      suffix={
        <>
          {visibilityToggle}
          {extraSuffix}
        </>
      }
      {...props}
    />
  );
});
