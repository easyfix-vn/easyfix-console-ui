"use client";

import * as React from "react";
import { enUS } from "./locales/en-US";
import { vi } from "./locales/vi";
import { zhCN } from "./locales/zh-CN";

export type EasyLocale = "zh-CN" | "en-US" | "vi";

/** 嵌套字典类型，叶子节点为字符串 */
export type LocaleMessages = {
  [key: string]: string | LocaleMessages;
};

/** 内置默认翻译资源（可被 ConfigProvider 的 messages 合并/覆盖） */
export const defaultMessages: Record<EasyLocale, LocaleMessages> = {
  "zh-CN": zhCN as unknown as LocaleMessages,
  "en-US": enUS as unknown as LocaleMessages,
  vi: vi as unknown as LocaleMessages,
};

/** 支持点路径取值，如 actions.search */
function getByPath(messages: LocaleMessages, key: string): string | undefined {
  const segments = key.split(".");
  let current: string | LocaleMessages | undefined = messages;
  for (const seg of segments) {
    if (current && typeof current === "object" && seg in current) {
      current = (current as LocaleMessages)[seg];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

/** 简易模板替换：{{name}} */
function interpolate(text: string, params?: Record<string, unknown>): string {
  if (!params) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, name: string) => {
    const v = params[name];
    return v == null ? "" : String(v);
  });
}

/** 深合并两个 messages 对象 */
export function mergeMessages(
  base: LocaleMessages,
  ext?: LocaleMessages,
): LocaleMessages {
  if (!ext) return base;
  const result: LocaleMessages = { ...base };
  for (const k of Object.keys(ext)) {
    const a = result[k];
    const b = ext[k];
    if (
      a &&
      b &&
      typeof a === "object" &&
      typeof b === "object" &&
      !Array.isArray(a) &&
      !Array.isArray(b)
    ) {
      result[k] = mergeMessages(a, b);
    } else if (b !== undefined) {
      result[k] = b;
    }
  }
  return result;
}

export type TFunction = (
  key: string,
  params?: Record<string, unknown>,
) => string;

type I18nContextValue = {
  locale: EasyLocale;
  messages: LocaleMessages;
  t: TFunction;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export type EasyI18nProviderProps = {
  locale: EasyLocale;
  messages?: LocaleMessages;
  children: React.ReactNode;
};

/** 内部 Provider，由 ConfigProvider 自动包裹 */
export function EasyI18nProvider({
  locale,
  messages,
  children,
}: EasyI18nProviderProps): React.ReactElement {
  const merged = React.useMemo(
    () => mergeMessages(defaultMessages[locale] ?? defaultMessages["zh-CN"], messages),
    [locale, messages],
  );

  const t = React.useCallback<TFunction>(
    (key, params) => {
      const text = getByPath(merged, key);
      // 找不到时返回原 key，便于业务传入 headerKey="姓名" 这类已是中文文案的场景
      return text == null ? key : interpolate(text, params);
    },
    [merged],
  );

  const value = React.useMemo(
    () => ({ locale, messages: merged, t }),
    [locale, merged, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** 组件库内部使用的 hook，自动随 ConfigProvider 的 locale 切换 */
export function useEasyT(): TFunction {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    // 如果未被 ConfigProvider 包裹，回退为「找不到 key 时返回 key 本身」
    return (key, params) => interpolate(key, params);
  }
  return ctx.t;
}

/** 同上，返回完整 i18n 上下文（含 locale） */
export function useEasyI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "zh-CN",
      messages: defaultMessages["zh-CN"],
      t: (key, params) => interpolate(key, params),
    };
  }
  return ctx;
}
