import type { EasyLocale } from "@/i18n";

/**
 * 轻量日期格式化（无外部依赖）。支持以下 token：
 *   YYYY 4 位年；YY 2 位年
 *   MM 2 位月；M 月（不补零）
 *   DD 2 位日；D 日（不补零）
 *   HH 2 位 24 小时；H 24 小时（不补零）
 *   mm 2 位分；m 分（不补零）
 *   ss 2 位秒；s 秒（不补零）
 */
export function formatDate(date: Date, template: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const map: Record<string, string> = {
    YYYY: pad(date.getFullYear(), 4),
    YY: pad(date.getFullYear() % 100, 2),
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad(date.getDate()),
    D: String(date.getDate()),
    HH: pad(date.getHours()),
    H: String(date.getHours()),
    mm: pad(date.getMinutes()),
    m: String(date.getMinutes()),
    ss: pad(date.getSeconds()),
    s: String(date.getSeconds()),
  };
  // 按 token 长度从长到短匹配，避免 YYYY 被识别为 YY+YY 等冲突
  return template.replace(
    /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g,
    (tok) => map[tok] ?? tok,
  );
}

/** 不同语言下的常用默认日期模板 */
export const DEFAULT_DATE_TEMPLATES: Record<EasyLocale, string> = {
  "zh-CN": "YYYY-MM-DD",
  "en-US": "MM/DD/YYYY",
  vi: "DD/MM/YYYY",
};

/** 不同语言下的常用默认日期时间模板（24 小时制） */
export const DEFAULT_DATETIME_TEMPLATES: Record<EasyLocale, string> = {
  "zh-CN": "YYYY-MM-DD HH:mm",
  "en-US": "MM/DD/YYYY HH:mm",
  vi: "DD/MM/YYYY HH:mm",
};

export type DateFormatter = string | ((date: Date) => string);

/** 将 string 模板或自定义函数统一转换为 (date)=>string */
export function resolveFormatter(
  formatter: DateFormatter | undefined,
  fallback: string,
): (date: Date) => string {
  if (typeof formatter === "function") return formatter;
  const template = formatter ?? fallback;
  return (date) => formatDate(date, template);
}
