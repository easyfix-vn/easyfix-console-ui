"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Popconfirm } from "@/components/ui/popconfirm";
import { Tabs, TabsPrimitive } from "@/components/ui/tabs";
import { useEasyT, type EasyLocale } from "@/i18n";
import { cn } from "@/lib/utils";

export type EasyI18nLocale = EasyLocale;

export type EasyI18nValue<Locale extends string = EasyI18nLocale> = {
  /** 主语言值，通常保存到非 i18n 字段。 */
  primary: string;
  /** 多语言映射，通常保存到 xxx_i18n 字段。 */
  i18n: Partial<Record<Locale, string>>;
};

export type EasyI18nLocaleOption<Locale extends string = EasyI18nLocale> = {
  /** 语言标识，例如 zh-CN、en-US、vi。 */
  locale: Locale;
  /** 语言在选择器中的展示名称。 */
  label: React.ReactNode;
};

export type EasyI18nInputType = "text" | "textarea";

export const DEFAULT_EASY_I18N_LOCALE_OPTIONS: readonly EasyI18nLocaleOption[] = [
  { locale: "vi", label: "Tiếng Việt" },
  { locale: "en-US", label: "English" },
  { locale: "zh-CN", label: "中文" },
];

export interface EasyI18nInputProps<Locale extends string = EasyI18nLocale>
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  value: EasyI18nValue<Locale>;
  onChange: (next: EasyI18nValue<Locale>) => void;
  /** 支持语言编码数组；不传时默认为 vi、en-US、zh-CN。 */
  supportLang?: readonly Locale[];
  /** 可选语言列表；不传时使用中文、英文、越南语。 */
  locales?: readonly EasyI18nLocaleOption<Locale>[];
  /** 输入控件类型，支持 text 和 textarea。 */
  type?: EasyI18nInputType;
  /** `type` 的别名，兼容参考 I18nInput 的调用方式。 */
  as?: EasyI18nInputType;
  /** 用于生成未自定义 placeholder/tips 时的字段名称。 */
  label?: React.ReactNode;
  /** 主语言输入框的 placeholder。 */
  placeholder?: string;
  /** 各多语言输入框的 placeholder。 */
  i18nPlaceholders?: Partial<Record<Locale, string>>;
  /** 主语言输入框下方的提示内容。 */
  tips?: React.ReactNode;
  /** 各多语言输入框下方的提示内容。 */
  i18nTips?: Partial<Record<Locale, React.ReactNode>>;
  /** 字数软限制：允许超出输入，超出时标记错误并阻止原生表单提交。 */
  maxLength?: number;
  /** 是否禁用全部编辑控件。 */
  disabled?: boolean;
  /** 主语言错误信息。 */
  error?: string;
  /** 多语言条目的错误信息。 */
  i18nErrors?: Partial<Record<Locale, string>>;
  /** textarea 的行数，仅 type/as 为 textarea 时生效。 */
  rows?: number;
}

export function EasyI18nInput<Locale extends string = EasyI18nLocale>({
  value,
  onChange,
  supportLang,
  locales,
  type,
  as,
  label,
  placeholder,
  i18nPlaceholders,
  tips,
  i18nTips,
  maxLength,
  disabled = false,
  error,
  i18nErrors,
  rows = 3,
  className,
  ...props
}: EasyI18nInputProps<Locale>): React.ReactElement {
  const t = useEasyT();
  const inputType = type ?? as ?? "text";
  const configuredLocaleOptions =
    locales ??
    (DEFAULT_EASY_I18N_LOCALE_OPTIONS as readonly EasyI18nLocaleOption<Locale>[]);
  const localeOptions = React.useMemo(() => {
    if (!supportLang) return configuredLocaleOptions;

    const configuredLabels = new Map(
      configuredLocaleOptions.map((option) => [option.locale, option.label]),
    );
    return [...new Set(supportLang)].map((locale) => ({
      locale,
      label: configuredLabels.get(locale) ?? locale,
    }));
  }, [configuredLocaleOptions, supportLang]);
  const [isLocalesOpen, setIsLocalesOpen] = React.useState(true);
  const primaryTabValue = "__easy_i18n_primary__";

  const localeOptionMap = React.useMemo(
    () => new Map(localeOptions.map((option) => [option.locale, option.label])),
    [localeOptions],
  );
  const valueLocales = React.useMemo(
    () => Object.keys(value.i18n) as Locale[],
    [value.i18n],
  );
  const [activeLocale, setActiveLocale] = React.useState<Locale>();
  const [activeTab, setActiveTab] = React.useState<string>(primaryTabValue);
  const [confirmingLocale, setConfirmingLocale] = React.useState<Locale | null>(
    null,
  );
  const knownLocaleSet = React.useMemo(
    () => new Set(localeOptions.map((option) => option.locale)),
    [localeOptions],
  );
  const usedLocales = React.useMemo(
    () => {
      const configuredLocales = localeOptions
        .map((option) => option.locale)
        .filter((locale) => valueLocales.includes(locale));

      if (supportLang) return configuredLocales;

      return [
        ...configuredLocales,
        ...valueLocales.filter((locale) => !knownLocaleSet.has(locale)),
      ];
    },
    [knownLocaleSet, localeOptions, supportLang, valueLocales],
  );
  const selectedTab =
    activeTab === primaryTabValue ||
    (activeTab != null && usedLocales.includes(activeTab as Locale))
      ? activeTab
      : primaryTabValue;

  const availableLocales = localeOptions.filter(
    (option) => !usedLocales.includes(option.locale),
  ).length;
  const hasAvailableLocales = availableLocales > 0;
  const hasLocaleEntries = usedLocales.length > 0;
  const showLocaleEntries = hasAvailableLocales || isLocalesOpen;

  function getLocaleLabel(locale: Locale): React.ReactNode {
    return localeOptionMap.get(locale) ?? locale;
  }

  function getLocaleName(locale: Locale): string {
    const label = getLocaleLabel(locale);
    return typeof label === "string" || typeof label === "number"
      ? String(label)
      : locale;
  }

  function getLabelText(): string {
    return typeof label === "string" || typeof label === "number"
      ? String(label)
      : t("i18nInput.field");
  }

  function getDefaultInputText(lang: string): string {
    return t("i18nInput.defaultPlaceholder", {
      label: getLabelText(),
      lang,
    });
  }

  function getPrimaryPlaceholder(): string {
    return placeholder ?? getDefaultInputText(t("i18nInput.defaultLocale"));
  }

  function getLocalePlaceholder(locale: Locale): string {
    return (
      i18nPlaceholders?.[locale] ?? getDefaultInputText(getLocaleName(locale))
    );
  }

  function getPrimaryTips(): React.ReactNode {
    return tips ?? getDefaultInputText(t("i18nInput.defaultLocale"));
  }

  function getLocaleTips(locale: Locale): React.ReactNode {
    return i18nTips?.[locale] ?? getDefaultInputText(getLocaleName(locale));
  }

  function setPrimary(next: string): void {
    onChange({ ...value, primary: next });
  }

  function setLocaleValue(locale: Locale, next: string): void {
    onChange({
      ...value,
      i18n: { ...value.i18n, [locale]: next },
    });
  }

  function addLocale(locale: Locale): void {
    const nextMap: Partial<Record<Locale, string>> = { ...value.i18n };
    nextMap[locale] = "";
    onChange({ ...value, i18n: nextMap });
    setActiveLocale(locale);
    setActiveTab(locale);
    setIsLocalesOpen(true);
  }

  function removeEntry(locale: Locale): void {
    const nextMap: Partial<Record<Locale, string>> = { ...value.i18n };
    delete nextMap[locale];
    if (activeLocale === locale) {
      const localeIndex = usedLocales.indexOf(locale);
      setActiveLocale(
        usedLocales[localeIndex + 1] ?? usedLocales[localeIndex - 1],
      );
    }
    if (activeTab === locale) {
      const localeIndex = usedLocales.indexOf(locale);
      setActiveTab(
        usedLocales[localeIndex + 1] ??
          usedLocales[localeIndex - 1] ??
          primaryTabValue,
      );
    }
    onChange({ ...value, i18n: nextMap });
  }

  function clearPrimary(): void {
    if (!value.primary) return;
    setPrimary("");
  }

  function clearLocale(locale: Locale): void {
    if (!value.i18n[locale]) return;
    setLocaleValue(locale, "");
  }

  const renderControl = (
    controlValue: string,
    onControlChange: (next: string) => void,
    controlPlaceholder?: string,
    controlDisabled = disabled,
    invalid = false,
  ): React.ReactNode =>
    inputType === "textarea" ? (
      <InputGroupTextarea
        aria-invalid={invalid || undefined}
        disabled={controlDisabled}
        maxLength={maxLength}
        placeholder={controlPlaceholder}
        rows={rows}
        value={controlValue}
        onChange={(event) => onControlChange(event.target.value)}
      />
    ) : (
      <InputGroupInput
        aria-invalid={invalid || undefined}
        disabled={controlDisabled}
        maxLength={maxLength}
        placeholder={controlPlaceholder}
        value={controlValue}
        onChange={(event) => onControlChange(event.target.value)}
      />
    );

  const localeActionClassName =
    "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40";
  const tabActionClassName =
    "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40";

  function renderClearAction(
    hasValue: boolean,
    onClear: () => void,
  ): React.ReactNode {
    return (
      <button
        type="button"
        aria-label={t("i18nInput.clearValue")}
        title={t("i18nInput.clearValue")}
        disabled={disabled || !hasValue}
        onClick={onClear}
        className={localeActionClassName}
        data-slot="easy-i18n-clear-action"
      >
        <XIcon className="size-4" />
      </button>
    );
  }

  function renderLocaleAction(): React.ReactNode {
    if (hasAvailableLocales) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            aria-label={t("i18nInput.addLocale")}
            title={t("i18nInput.addLocale")}
            disabled={disabled}
            className={tabActionClassName}
            data-slot="easy-i18n-locale-action"
          >
            <PlusIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {localeOptions
              .filter((option) => !usedLocales.includes(option.locale))
              .map((option) => (
                <DropdownMenuItem
                  key={option.locale}
                  onSelect={() => addLocale(option.locale)}
                >
                  <GlobeIcon className="size-4 text-muted-foreground" />
                  <span className="truncate">{option.label}</span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (!hasLocaleEntries) return null;

    return (
      <button
        type="button"
        aria-label={t(
          isLocalesOpen
            ? "i18nInput.collapseLocales"
            : "i18nInput.expandLocales",
        )}
        title={t(
          isLocalesOpen
            ? "i18nInput.collapseLocales"
            : "i18nInput.expandLocales",
        )}
        onClick={() => setIsLocalesOpen((current) => !current)}
        className={tabActionClassName}
        data-slot="easy-i18n-locale-action"
      >
        {isLocalesOpen ? (
          <ChevronUpIcon className="size-3.5" />
        ) : (
          <ChevronDownIcon className="size-3.5" />
        )}
      </button>
    );
  }

  return (
    <div
      {...props}
      className={cn("flex w-full min-w-0 flex-col gap-2.5", className)}
      data-slot="easy-i18n-input"
    >
      <Tabs
        className="min-w-0 gap-1"
        value={selectedTab}
        onValueChange={(next) => {
          setActiveTab(next);
          if (next !== primaryTabValue) setActiveLocale(next as Locale);
        }}
      >
        <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-0.5">
          <TabsPrimitive.List
            className="flex w-max min-w-full items-center gap-px rounded-md bg-muted p-0.5"
            data-slot="easy-i18n-locale-tabs"
          >
            <TabsPrimitive.Tab
              value={primaryTabValue}
              className="relative flex h-6 min-w-0 max-w-24 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent px-1.5 text-xs font-medium leading-4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-active:bg-background data-active:text-foreground data-active:shadow-sm"
              data-slot="easy-i18n-primary-tab"
              title={t("i18nInput.defaultLocale")}
            >
              <span className="max-w-20 truncate">
                {t("i18nInput.defaultLocale")}
              </span>
            </TabsPrimitive.Tab>

            {showLocaleEntries &&
              usedLocales.map((locale) => (
                <div
                  key={locale}
                  className={cn(
                    "group/easy-i18n-tab-item inline-flex h-6 shrink-0 items-center rounded border border-transparent transition-colors",
                    selectedTab === locale
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  data-active={selectedTab === locale ? "true" : undefined}
                  data-locale={locale}
                  data-slot="easy-i18n-locale-tab-item"
                >
                  <TabsPrimitive.Tab
                    value={locale}
                    className="relative flex h-6 min-w-0 max-w-24 shrink-0 cursor-pointer items-center justify-center rounded-s border border-transparent px-1.5 pe-0.5 text-xs font-medium leading-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-slot="easy-i18n-locale-tab"
                    title={getLocaleName(locale)}
                  >
                    <span className="max-w-20 truncate">
                      {getLocaleLabel(locale)}
                    </span>
                  </TabsPrimitive.Tab>
                  <Popconfirm
                    open={confirmingLocale === locale}
                    onOpenChange={(open) =>
                      setConfirmingLocale(open ? locale : null)
                    }
                    title={t("i18nInput.confirmRemoveLocale", {
                      locale: getLocaleName(locale),
                    })}
                    description={t(
                      "i18nInput.confirmRemoveLocaleDescription",
                    )}
                    confirmText={t("actions.confirm")}
                    cancelText={t("actions.cancel")}
                    align="end"
                    onConfirm={() => removeEntry(locale)}
                  >
                    <button
                      type="button"
                      aria-label={t("i18nInput.removeLocale")}
                      title={t("i18nInput.removeLocale")}
                      disabled={disabled}
                      className={cn(
                        tabActionClassName,
                        "rounded-s-none rounded-e-md",
                      )}
                      data-slot="easy-i18n-remove-locale"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Popconfirm>
                </div>
              ))}

            <div className="ms-auto shrink-0">{renderLocaleAction()}</div>
          </TabsPrimitive.List>
        </div>

        <TabsPrimitive.Panel
          value={primaryTabValue}
          keepMounted
          className="mt-0 min-w-0 rounded-none border-0 p-0"
          data-slot="easy-i18n-primary-panel"
        >
          <div className="flex min-w-0 flex-col gap-1" data-slot="easy-i18n-primary">
            <InputGroup
              className={cn(
                inputType === "textarea" && "items-start",
                error && "border-destructive/64",
              )}
            >
              {renderControl(
                value.primary,
                setPrimary,
                getPrimaryPlaceholder(),
                disabled,
                Boolean(error),
              )}
              <InputGroupAddon
                align="inline-end"
                className={cn(
                  "!me-0 shrink-0 pe-1",
                  inputType === "textarea" && "pt-2",
                )}
              >
                {renderClearAction(Boolean(value.primary), clearPrimary)}
              </InputGroupAddon>
            </InputGroup>
            <TipsAndError
              text={value.primary}
              max={maxLength}
              error={error}
              tips={getPrimaryTips()}
            />
          </div>
        </TabsPrimitive.Panel>

        {showLocaleEntries &&
          usedLocales.map((locale) => {
            const entryValue = value.i18n[locale] ?? "";
            const entryError = i18nErrors?.[locale];
            return (
              <TabsPrimitive.Panel
                key={locale}
                value={locale}
                keepMounted
                className="mt-0 min-w-0 rounded-none border-0 p-0"
                data-slot="easy-i18n-locale-panel"
              >
                <div
                  className="flex min-w-0 flex-col gap-1"
                  data-locale={locale}
                  data-slot="easy-i18n-entry"
                >
                  <InputGroup
                    className={cn(
                      inputType === "textarea" && "items-start",
                      entryError && "border-destructive/64",
                    )}
                  >
                    {renderControl(
                      entryValue,
                      (next) => setLocaleValue(locale, next),
                      getLocalePlaceholder(locale),
                      disabled,
                      Boolean(entryError),
                    )}
                    <InputGroupAddon
                      align="inline-end"
                      className={cn(
                        "!me-0 shrink-0 pe-1",
                        inputType === "textarea" && "pt-2",
                      )}
                    >
                      {renderClearAction(Boolean(entryValue), () =>
                        clearLocale(locale),
                      )}
                    </InputGroupAddon>
                  </InputGroup>
                  <TipsAndError
                    text={entryValue}
                    max={maxLength}
                    error={entryError}
                    tips={getLocaleTips(locale)}
                  />
                </div>
              </TabsPrimitive.Panel>
            );
          })}
      </Tabs>
    </div>
  );
}

function TipsAndError({
  text,
  max,
  error,
  tips,
}: {
  text: string;
  max?: number;
  error?: string;
  tips?: React.ReactNode;
}): React.ReactElement | null {
  if (!error && max == null && tips == null) return null;

  return (
    <div className="flex min-h-4 items-center justify-between px-1 text-xs leading-4">
      <span className={cn(error ? "text-destructive" : "text-muted-foreground")}>
        {error ?? tips ?? " "}
      </span>
      {max != null && (
        <span
          className={cn(
            "text-muted-foreground tabular-nums",
            text.length > max && "text-destructive",
          )}
        >
          {text.length}/{max}
        </span>
      )}
    </div>
  );
}

/** 短命名别名，便于从参考 I18nInput 迁移。 */
export const I18nInput = EasyI18nInput;
export type I18nInputProps<Locale extends string = EasyI18nLocale> =
  EasyI18nInputProps<Locale>;
export type I18nValue<Locale extends string = EasyI18nLocale> =
  EasyI18nValue<Locale>;
