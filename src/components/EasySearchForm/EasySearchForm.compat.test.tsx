import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "../../i18n";
import * as current from "./index";
import * as legacy from "../EasySearchTable/EasySearchForm";
import type { EasySearchFormProps as CurrentProps } from "./EasySearchForm";
import type { EasySearchFormProps as LegacyProps } from "../EasySearchTable/EasySearchForm";
import type { SearchFieldDef as CurrentField, SearchMode as CurrentMode } from "./types";
import type { SearchFieldDef as LegacyField, SearchMode as LegacyMode } from "../EasySearchTable/types";

type IsAssignable<From, To> = [From] extends [To] ? true : false;

// 单独执行 TypeScript 检查时，验证旧、新导出可以双向赋值。
const compatibleTypes: [
  IsAssignable<LegacyProps, CurrentProps>,
  IsAssignable<CurrentProps, LegacyProps>,
  IsAssignable<LegacyField, CurrentField>,
  IsAssignable<CurrentField, LegacyField>,
  IsAssignable<LegacyMode, CurrentMode>,
  IsAssignable<CurrentMode, LegacyMode>,
] = [true, true, true, true, true, true];

const fields = [
  { key: "customer", labelKey: "Customer", type: "input" },
] satisfies CurrentField[];
const legacyFields: LegacyField[] = fields;
const mode = "manual" satisfies CurrentMode;
const legacyMode: LegacyMode = mode;

describe("EasySearchForm compatibility", () => {
  it("keeps legacy runtime exports identical to the standalone module", () => {
    expect(legacy.EasySearchForm).toBe(current.EasySearchForm);
    expect(legacy.EasySearchFormActions).toBe(current.EasySearchFormActions);
    expect(legacy.EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD).toBe(current.EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD);
    expect(legacy.EASY_SEARCH_FORM_COLLAPSED_FIELDS).toBe(current.EASY_SEARCH_FORM_COLLAPSED_FIELDS);
    expect(legacy.getSearchFieldDefaultValues).toBe(current.getSearchFieldDefaultValues);
    expect(legacy.getSearchFieldColumnSpan).toBe(current.getSearchFieldColumnSpan);
    expect(compatibleTypes).toEqual([true, true, true, true, true, true]);
  });

  it("preserves an unsubmitted draft when locale changes recreate field definitions", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(
      <EasyI18nProvider locale="en-US">
        <legacy.EasySearchForm fields={legacyFields} searchMode={legacyMode} onSearch={onSearch} onReset={onReset} />
      </EasyI18nProvider>,
    );

    await user.type(screen.getByRole("textbox", { name: "Customer" }), "Alice");
    expect(onSearch).not.toHaveBeenCalled();

    const localizedFields = fields.map((field) => ({ ...field, labelKey: "Khách hàng" }));
    rerender(
      <EasyI18nProvider locale="vi">
        <legacy.EasySearchForm fields={localizedFields} searchMode={mode} onSearch={onSearch} onReset={onReset} />
      </EasyI18nProvider>,
    );

    expect(screen.getByRole("textbox", { name: "Khách hàng" })).toHaveValue("Alice");
    expect(onSearch).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith({ customer: "Alice" });
  });
});
