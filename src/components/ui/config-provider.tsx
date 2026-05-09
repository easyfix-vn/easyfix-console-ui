"use client";

import * as React from "react";
import {
  EasyI18nProvider,
  type EasyLocale,
  type LocaleMessages,
} from "@/i18n";

export type ConfigProviderProps = {
  /** 应用语言，控制内置组件文案（搜索、表格、分页等） */
  locale?: EasyLocale;
  /** 主题：light / dark / system（跟随系统） */
  theme?: "light" | "dark" | "system";
  /** CSS 类名前缀，预留给未来支持自定义命名空间 */
  prefix?: string;
  /** 自定义/扩展翻译文案，会与内置 messages 深合并（可覆盖默认值） */
  messages?: LocaleMessages;
  children: React.ReactNode;
};

type ConfigContextValue = {
  locale: EasyLocale;
  theme: "light" | "dark" | "system";
  prefix: string;
  /** 当前主题解析为实际生效的 light/dark（system 会跟随系统） */
  resolvedTheme: "light" | "dark";
};

const ConfigContext = React.createContext<ConfigContextValue>({
  locale: "zh-CN",
  theme: "system",
  prefix: "easy",
  resolvedTheme: "light",
});

export function useConfig(): ConfigContextValue {
  return React.useContext(ConfigContext);
}

export function ConfigProvider({
  locale = "zh-CN",
  theme = "system",
  prefix = "easy",
  messages,
  children,
}: ConfigProviderProps): React.ReactElement {
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    () => {
      if (theme === "dark") return "dark";
      if (theme === "light") return "light";
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    },
  );

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      setResolvedTheme("dark");
      return;
    }
    if (theme === "light") {
      root.classList.remove("dark");
      setResolvedTheme("light");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (matches: boolean) => {
      root.classList.toggle("dark", matches);
      setResolvedTheme(matches ? "dark" : "light");
    };
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    apply(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // 把 locale 同步到 <html lang>，便于无障碍/搜索引擎识别
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = React.useMemo(
    () => ({ locale, theme, prefix, resolvedTheme }),
    [locale, theme, prefix, resolvedTheme],
  );

  return (
    <ConfigContext.Provider value={value}>
      <EasyI18nProvider locale={locale} messages={messages}>
        {children}
      </EasyI18nProvider>
    </ConfigContext.Provider>
  );
}
