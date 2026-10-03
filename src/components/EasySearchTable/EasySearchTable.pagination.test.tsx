import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { EasyI18nProvider } from "@/i18n";
import { EasySearchTable, type SearchFieldDef } from "./EasySearchTable";

const defaultProps = {
  columns: [{ key: "name", headerKey: "Name" }],
  searchFields: [{ key: "name", labelKey: "Name", type: "input", placeholder: "Search name" }] as SearchFieldDef[],
  data: [{ name: "Alice" }],
  total: 60,
  page: 1,
  pageSize: 10,
};

function renderWithI18n(ui: ReactElement) {
  return render(<EasyI18nProvider locale="en-US">{ui}</EasyI18nProvider>);
}

// Keep fake-clock pagination tests isolated from pointer interaction tests:
// Base UI's popup transitions and input-modality state outlive a single click.
describe("EasySearchTable pending pagination", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each(["auto", "manual"] as const)(
    "preserves a pending %s search when changing page size without submitting newer drafts",
    (searchMode) => {
      vi.useFakeTimers();
      const onSearch = vi.fn();
      const { unmount } = renderWithI18n(
        <EasySearchTable
          {...defaultProps}
          total={60}
          searchMode={searchMode}
          searchThrottleMs={300}
          onSearch={onSearch}
        />,
      );

      try {
        const input = screen.getByPlaceholderText("Search name");
        const submit = () => searchMode === "auto"
          ? fireEvent.blur(input)
          : fireEvent.click(screen.getByRole("button", { name: "Search" }));

        fireEvent.change(input, { target: { value: "Alice" } });
        submit();
        fireEvent.change(input, { target: { value: "Bob" } });
        submit();
        expect(onSearch).toHaveBeenCalledTimes(1);

        // Manual edits after clicking Search remain drafts; the queued Bob
        // request must win over both the old Alice result and this newer edit.
        if (searchMode === "manual") {
          fireEvent.change(input, { target: { value: "Charlie" } });
        }

        fireEvent.keyDown(screen.getByRole("combobox", { name: "Rows per page" }), { key: "ArrowDown" });
        const pageSizeOption = screen.getByRole("option", { name: "20 / page" });
        fireEvent.pointerDown(pageSizeOption);
        fireEvent.click(pageSizeOption);

        expect(onSearch).toHaveBeenLastCalledWith({ name: "Bob", page: 1, pageSize: 20 });
        expect(onSearch).toHaveBeenCalledTimes(2);
        expect(input).toHaveValue(searchMode === "manual" ? "Charlie" : "Bob");

        act(() => vi.advanceTimersByTime(300));
        expect(onSearch).toHaveBeenCalledTimes(2);

        fireEvent.click(screen.getByRole("button", { name: "Next page" }));
        expect(onSearch).toHaveBeenLastCalledWith({ name: "Bob", page: 2, pageSize: 20 });
      } finally {
        unmount();
        act(() => vi.runOnlyPendingTimers());
        vi.useRealTimers();
      }
    },
  );

});
