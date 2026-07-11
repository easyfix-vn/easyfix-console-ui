"use client";

export type EasyPriceValue = string | number | null | undefined;

export type EasyCurrencyCode =
  | "VND"
  | "USD"
  | "EUR"
  | "CNY"
  | "JPY"
  | "KRW"
  | "THB"
  | "SGD"
  | "MYR"
  | "IDR"
  | "PHP"
  | "AUD"
  | "CAD"
  | "GBP"
  | "CHF"
  | "HKD"
  | "TWD"
  | "INR"
  | "BRL"
  | (string & {});

export type EasyPriceUnitPosition = "prefix" | "suffix";

export type EasyPriceSize = "sm" | "default" | "lg";

export interface EasyPriceCurrencyOption {
  currency: EasyCurrencyCode;
  label?: string;
  unitText?: string;
  fractionDigits?: number;
}

export const DEFAULT_PRICE_CURRENCY_OPTIONS: EasyPriceCurrencyOption[] = [
  { currency: "VND", label: "VND", unitText: "VND", fractionDigits: 0 },
  { currency: "USD", label: "USD", unitText: "USD", fractionDigits: 2 },
  { currency: "EUR", label: "EUR", unitText: "EUR", fractionDigits: 2 },
  { currency: "CNY", label: "CNY", unitText: "CNY", fractionDigits: 2 },
  { currency: "JPY", label: "JPY", unitText: "JPY", fractionDigits: 0 },
  { currency: "KRW", label: "KRW", unitText: "KRW", fractionDigits: 0 },
  { currency: "THB", label: "THB", unitText: "THB", fractionDigits: 2 },
  { currency: "SGD", label: "SGD", unitText: "SGD", fractionDigits: 2 },
];

const ZERO_FRACTION_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const THREE_FRACTION_CURRENCIES = new Set(["BHD", "JOD", "KWD", "LYD", "OMR", "TND"]);

export function normalizeCurrencyCode(currency: EasyCurrencyCode = "VND"): string {
  return String(currency || "VND").trim().toUpperCase();
}

export function getCurrencyFractionDigits(
  currency: EasyCurrencyCode = "VND",
  precision?: number,
): number {
  if (typeof precision === "number" && Number.isFinite(precision)) {
    return Math.max(0, Math.min(6, Math.trunc(precision)));
  }

  const code = normalizeCurrencyCode(currency);

  if (ZERO_FRACTION_CURRENCIES.has(code)) {
    return 0;
  }

  if (THREE_FRACTION_CURRENCIES.has(code)) {
    return 3;
  }

  return 2;
}

export function getPriceCurrencyOption(
  currency: EasyCurrencyCode,
  options: EasyPriceCurrencyOption[] = DEFAULT_PRICE_CURRENCY_OPTIONS,
): EasyPriceCurrencyOption | undefined {
  const code = normalizeCurrencyCode(currency);
  return options.find((option) => normalizeCurrencyCode(option.currency) === code);
}

export function getPriceUnitText(
  currency: EasyCurrencyCode = "VND",
  unitText?: string,
  options?: EasyPriceCurrencyOption[],
): string {
  if (unitText !== undefined) {
    return unitText;
  }

  const option = getPriceCurrencyOption(currency, options);
  return option?.unitText ?? normalizeCurrencyCode(currency);
}

export function parsePriceValue(value: EasyPriceValue): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizePriceValue(
  value: EasyPriceValue,
  precision: number,
): string {
  const parsed = parsePriceValue(value);

  if (parsed === undefined) {
    return "";
  }

  if (precision <= 0) {
    return String(Math.trunc(parsed));
  }

  return parsed.toFixed(precision);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizePriceInput(
  value: string,
  {
    precision,
    groupSeparator = ",",
    decimalSeparator = ".",
    allowNegative = false,
  }: {
    precision: number;
    groupSeparator?: string;
    decimalSeparator?: string;
    allowNegative?: boolean;
  },
): string {
  const trimmed = value.trim();
  const isNegative = allowNegative && trimmed.startsWith("-");
  let text = trimmed;

  if (groupSeparator) {
    text = text.replace(new RegExp(escapeRegExp(groupSeparator), "g"), "");
  }

  if (decimalSeparator && decimalSeparator !== ".") {
    text = text.replace(new RegExp(escapeRegExp(decimalSeparator), "g"), ".");
  }

  text = text.replace(/[^\d.]/g, "");

  const [integerRaw = "", ...fractionParts] = text.split(".");
  const integer = integerRaw.replace(/^0+(?=\d)/, "") || "";
  const hasDecimal = precision > 0 && text.includes(".");
  const fraction = fractionParts.join("").slice(0, precision);

  if (!integer && !hasDecimal) {
    return isNegative ? "-" : "";
  }

  const sign = isNegative ? "-" : "";
  if (precision <= 0) {
    return `${sign}${integer || "0"}`;
  }

  return `${sign}${integer || "0"}${hasDecimal ? `.${fraction}` : ""}`;
}

export function formatNumberParts(
  normalizedValue: string,
  {
    precision,
    useGrouping = true,
    groupSeparator = ",",
    decimalSeparator = ".",
    preserveFraction = false,
  }: {
    precision: number;
    useGrouping?: boolean;
    groupSeparator?: string;
    decimalSeparator?: string;
    preserveFraction?: boolean;
  },
): string {
  if (!normalizedValue || normalizedValue === "-") {
    return normalizedValue;
  }

  const isNegative = normalizedValue.startsWith("-");
  const unsignedValue = isNegative ? normalizedValue.slice(1) : normalizedValue;
  const [integerRaw = "0", fractionRaw = ""] = unsignedValue.split(".");
  const normalizedInteger = integerRaw.replace(/^0+(?=\d)/, "") || "0";
  const groupedInteger = useGrouping
    ? normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
    : normalizedInteger;
  const fraction =
    precision > 0
      ? preserveFraction
        ? fractionRaw.slice(0, precision)
        : fractionRaw.padEnd(precision, "0").slice(0, precision)
      : "";
  const hasFraction =
    precision > 0 && (preserveFraction ? unsignedValue.includes(".") : true);

  return `${isNegative ? "-" : ""}${groupedInteger}${
    hasFraction ? `${decimalSeparator}${fraction}` : ""
  }`;
}

export function formatPriceInputValue(
  value: string,
  {
    precision,
    useGrouping = true,
    groupSeparator = ",",
    decimalSeparator = ".",
    allowNegative = false,
  }: {
    precision: number;
    useGrouping?: boolean;
    groupSeparator?: string;
    decimalSeparator?: string;
    allowNegative?: boolean;
  },
): string {
  const normalized = sanitizePriceInput(value, {
    precision,
    groupSeparator,
    decimalSeparator,
    allowNegative,
  });

  return formatNumberParts(normalized, {
    precision,
    useGrouping,
    groupSeparator,
    decimalSeparator,
    preserveFraction: true,
  });
}

export function formatPriceAmount(
  value: EasyPriceValue,
  {
    currency = "VND",
    precision,
    useGrouping = true,
    groupSeparator = ",",
    decimalSeparator = ".",
  }: {
    currency?: EasyCurrencyCode;
    precision?: number;
    useGrouping?: boolean;
    groupSeparator?: string;
    decimalSeparator?: string;
  } = {},
): string {
  const resolvedPrecision = getCurrencyFractionDigits(currency, precision);
  const normalized = normalizePriceValue(value, resolvedPrecision);

  return formatNumberParts(normalized, {
    precision: resolvedPrecision,
    useGrouping,
    groupSeparator,
    decimalSeparator,
  });
}

export function formatPriceText(
  value: EasyPriceValue,
  {
    currency = "VND",
    precision,
    useGrouping = true,
    groupSeparator = ",",
    decimalSeparator = ".",
    unitText,
    unitPosition = "suffix",
    emptyText = "-",
  }: {
    currency?: EasyCurrencyCode;
    precision?: number;
    useGrouping?: boolean;
    groupSeparator?: string;
    decimalSeparator?: string;
    unitText?: string;
    unitPosition?: EasyPriceUnitPosition;
    emptyText?: string;
  } = {},
): string {
  const amount = formatPriceAmount(value, {
    currency,
    precision,
    useGrouping,
    groupSeparator,
    decimalSeparator,
  });

  if (!amount) {
    return emptyText;
  }

  const resolvedUnitText = getPriceUnitText(currency, unitText);

  if (!resolvedUnitText) {
    return amount;
  }

  return unitPosition === "prefix"
    ? `${resolvedUnitText} ${amount}`
    : `${amount} ${resolvedUnitText}`;
}
