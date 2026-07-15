import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  EasySearchTable,
  type ColumnDef,
  type EasySearchTableEmptyContext,
  type EasySearchTableExportContext,
  type SearchFieldDef,
} from "./EasySearchTable";
import { EasyI18nProvider } from "@/i18n";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => {
      const minWidth = Number(query.match(/min-width:\s*(\d+)px/)?.[1] ?? 0);
      const maxWidth = Number(query.match(/max-width:\s*(\d+)px/)?.[1] ?? Infinity);

      return {
        matches: width >= minWidth && width <= maxWidth,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}

type MockRecord = {
  id: string;
  name: string;
  status: string;
};

const mockData: MockRecord[] = [
  { id: "1", name: "Alice", status: "active" },
  { id: "2", name: "Bob", status: "inactive" },
  { id: "3", name: "Charlie", status: "active" },
];

const columns: ColumnDef<MockRecord>[] = [
  { key: "id", headerKey: "ID", width: 60 },
  { key: "name", headerKey: "Name" },
  { key: "status", headerKey: "Status" },
];

const searchFields: SearchFieldDef[] = [
  { key: "name", labelKey: "Name", type: "input", placeholder: "Search name" },
];

const defaultProps = {
  columns,
  searchFields,
  data: mockData,
  total: mockData.length,
  page: 1,
  pageSize: 10,
  onSearch: vi.fn(),
};

function renderWithI18n(ui: ReactElement) {
  return render(
    <EasyI18nProvider locale="en-US">
      {ui}
    </EasyI18nProvider>,
  );
}

describe("EasySearchTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewportWidth(390);
  });

  it("renders table headers", () => {
    render(<EasySearchTable {...defaultProps} />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("ID")).toBeInTheDocument();
    expect(within(table).getByText("Name")).toBeInTheDocument();
    expect(within(table).getByText("Status")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<EasySearchTable {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("omits the search form when no search fields are configured", () => {
    const { container } = renderWithI18n(
      <EasySearchTable {...defaultProps} searchFields={[]} />,
    );

    expect(container.querySelector('[data-slot="easy-search-form"]')).not.toBeInTheDocument();
  });

  it("shows total count", () => {
    render(<EasySearchTable {...defaultProps} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("renders skeleton when loading", () => {
    render(<EasySearchTable {...defaultProps} loading />);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("renders add button when onAdd provided", () => {
    const onAdd = vi.fn();
    render(<EasySearchTable {...defaultProps} onAdd={onAdd} />);
    const addBtns = screen.getAllByRole("button");
    const addBtn = addBtns.find((btn) => btn.querySelector("svg"));
    expect(addBtn).toBeDefined();
  });

  it("renders export button when showExport is true", () => {
    render(<EasySearchTable {...defaultProps} showExport />);
    expect(
      screen.getByRole("button", { name: /export|导出/i }),
    ).toBeInTheDocument();
  });

  it("only searches when submitted conditions have changed", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithI18n(
      <EasySearchTable
        {...defaultProps}
        searchMode="manual"
        onSearch={onSearch}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search name"), "Alice");
    const searchBtn = screen.getByRole("button", { name: "Search" });

    await user.click(searchBtn);
    await user.click(searchBtn);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, name: "Alice" }),
    );
  });

  it("treats equivalent Date values in new search objects as unchanged", () => {
    const onSearch = vi.fn();
    const rangeFields: SearchFieldDef[] = [
      {
        key: "range",
        labelKey: "Range",
        type: "custom",
        render: (_value, onChange) => (
          <button
            type="button"
            onClick={() =>
              onChange({
                from: new Date("2026-07-01T00:00:00.000Z"),
                to: new Date("2026-07-02T00:00:00.000Z"),
              })
            }
          >
            Pick range
          </button>
        ),
      },
    ];

    render(
      <EasySearchTable
        {...defaultProps}
        searchFields={rangeFields}
        searchThrottleMs={0}
        onSearch={onSearch}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pick range" }));
    fireEvent.click(screen.getByRole("button", { name: "Pick range" }));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("throttles rapid searches and submits the latest conditions", () => {
    vi.useFakeTimers();

    try {
      const onSearch = vi.fn();
      const throttledFields: SearchFieldDef[] = [
        {
          key: "flag",
          labelKey: "Flag",
          type: "custom",
          render: (_value, onChange) => (
            <>
              <button type="button" onClick={() => onChange("first")}>
                First value
              </button>
              <button type="button" onClick={() => onChange("latest")}>
                Latest value
              </button>
            </>
          ),
        },
      ];

      render(
        <EasySearchTable
          {...defaultProps}
          searchFields={throttledFields}
          searchThrottleMs={300}
          onSearch={onSearch}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "First value" }));
      fireEvent.click(screen.getByRole("button", { name: "Latest value" }));

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ flag: "first" }),
      );

      act(() => vi.advanceTimersByTime(299));
      expect(onSearch).toHaveBeenCalledTimes(1);

      act(() => vi.advanceTimersByTime(1));
      expect(onSearch).toHaveBeenCalledTimes(2);
      expect(onSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ flag: "latest" }),
      );
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it("auto searches when input loses focus by default", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<EasySearchTable {...defaultProps} onSearch={onSearch} />);

    await user.type(screen.getByPlaceholderText("Search name"), "Alice");
    expect(onSearch).not.toHaveBeenCalled();

    await user.tab();

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, name: "Alice" }),
    );
  });

  it("clears input search field with a clear icon button", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithI18n(<EasySearchTable {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search name");
    await user.type(input, "Alice");

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(input).toHaveValue("");
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, name: "" }),
    );
  });

  it("renders an all option with empty value before select options", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const selectFields: SearchFieldDef[] = [
      {
        key: "status",
        labelKey: "Status",
        type: "select",
        placeholder: "Select status",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ];

    renderWithI18n(
      <EasySearchTable
        {...defaultProps}
        searchFields={selectFields}
        onSearch={onSearch}
        searchThrottleMs={0}
      />,
    );

    await user.click(screen.getByText("Select status"));

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("All");

    await user.click(options[0]);

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, status: "" }),
    );
  });

  it("clears a select filter to an empty value", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const selectFields: SearchFieldDef[] = [
      {
        key: "status",
        labelKey: "Status",
        type: "select",
        placeholder: "Select status",
        options: [{ label: "Active", value: "active" }],
      },
    ];

    const { container } = renderWithI18n(
      <EasySearchTable
        {...defaultProps}
        searchFields={selectFields}
        onSearch={onSearch}
        searchThrottleMs={0}
      />,
    );

    const searchForm = container.querySelector('[data-slot="easy-search-form"]');
    expect(searchForm).toBeTruthy();

    await user.click(screen.getByText("Select status"));
    await user.click(await screen.findByRole("option", { name: "Active" }));
    await user.click(within(searchForm!).getByRole("button", { name: "清空" }));

    expect(onSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, status: "" }),
    );
  });

  it("auto searches when custom fields change", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const customFields: SearchFieldDef[] = [
      {
        key: "flag",
        labelKey: "Flag",
        type: "custom",
        render: (_value, onChange) => (
          <button type="button" onClick={() => onChange("enabled")}>
            Pick flag
          </button>
        ),
      },
    ];

    render(
      <EasySearchTable
        {...defaultProps}
        searchFields={customFields}
        onSearch={onSearch}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pick flag" }));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, flag: "enabled" }),
    );
  });

  it("does not auto search in manual mode", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const customFields: SearchFieldDef[] = [
      {
        key: "flag",
        labelKey: "Flag",
        type: "custom",
        render: (_value, onChange) => (
          <button type="button" onClick={() => onChange("enabled")}>
            Pick flag
          </button>
        ),
      },
    ];

    render(
      <EasySearchTable
        {...defaultProps}
        searchFields={customFields}
        searchMode="manual"
        onSearch={onSearch}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pick flag" }));
    expect(onSearch).not.toHaveBeenCalled();

    const searchBtn = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("search") || btn.textContent?.includes("搜索")
    );
    if (!searchBtn) throw new Error("Search button not found");

    await user.click(searchBtn);

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, flag: "enabled" }),
    );
  });

  it("renders one mobile search action group beside toolbarActions", () => {
    render(
      <EasySearchTable
        {...defaultProps}
        toolbarActions={<button type="button">Toolbar action</button>}
      />,
    );

    const toolbarAction = screen.getByRole("button", { name: "Toolbar action" });
    const toolbarGroup = toolbarAction.parentElement;

    expect(toolbarGroup).toHaveClass("items-center", "gap-2");
    expect(
      toolbarGroup?.querySelector('[data-slot="easy-search-form-actions"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="easy-search-form-actions"]'),
    ).toHaveLength(1);
  });

  it("renders search before reset in the action group", () => {
    renderWithI18n(<EasySearchTable {...defaultProps} />);

    const actions = document.querySelector('[data-slot="easy-search-form-actions"]');
    const labels = Array.from(actions?.querySelectorAll("button") ?? []).map(
      (button) => button.textContent?.trim(),
    );
    const commandButtons = Array.from(
      actions?.querySelectorAll("button") ?? [],
    ).slice(0, 2);

    expect(labels.slice(0, 2)).toEqual(["Search", "Reset"]);
    expect(commandButtons.every((button) => button.querySelector("svg"))).toBe(true);
  });

  it("keeps actions in a third grid cell when fewer than three fields are visible", () => {
    setViewportWidth(1280);
    const twoFields: SearchFieldDef[] = [
      ...searchFields,
      { key: "status", labelKey: "Status", type: "input" },
    ];

    render(<EasySearchTable {...defaultProps} searchFields={twoFields} />);

    const actions = document.querySelector('[data-slot="easy-search-form-actions"]');
    expect(actions?.parentElement).toHaveClass("grid", "xl:grid-cols-3");
    expect(actions).toHaveClass("justify-end");
    expect(actions).not.toHaveClass("justify-start");
    expect(document.querySelectorAll('[data-slot="easy-search-form-actions"]')).toHaveLength(1);
  });

  it("left aligns inline actions when their cell is not the last column", () => {
    setViewportWidth(1280);

    render(<EasySearchTable {...defaultProps} />);

    const actions = document.querySelector('[data-slot="easy-search-form-actions"]');
    expect(actions?.parentElement).toHaveClass("grid", "xl:grid-cols-3");
    expect(actions).toHaveClass("justify-start");
    expect(actions).not.toHaveClass("justify-end");
  });

  it("moves actions to the toolbar when fields fill the responsive row", () => {
    setViewportWidth(800);
    const twoFields: SearchFieldDef[] = [
      ...searchFields,
      { key: "status", labelKey: "Status", type: "input" },
    ];

    render(
      <EasySearchTable
        {...defaultProps}
        searchFields={twoFields}
        toolbarActions={<button type="button">Toolbar action</button>}
      />,
    );

    const toolbarAction = screen.getByRole("button", { name: "Toolbar action" });
    expect(
      toolbarAction.parentElement?.querySelector('[data-slot="easy-search-form-actions"]'),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="easy-search-form-actions"]')).toHaveLength(1);
  });

  it("collapses after five fields by default and recalculates action placement", async () => {
    setViewportWidth(1280);
    const user = userEvent.setup();
    const sixFields: SearchFieldDef[] = Array.from({ length: 6 }, (_, index) => ({
      key: `field${index + 1}`,
      labelKey: `Field ${index + 1}`,
      type: "input" as const,
    }));

    renderWithI18n(
      <EasySearchTable {...defaultProps} searchFields={sixFields} />,
    );

    expect(screen.queryByText("Field 6")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /expand/i }));
    expect(screen.getByText("Field 6")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="easy-search-form-actions"]')).toHaveLength(1);
  });

  it("initializes custom search fields with a controlled null value", () => {
    const renderValue = vi.fn(() => null);
    const customFields: SearchFieldDef[] = [
      {
        key: "minId",
        labelKey: "Minimum ID",
        type: "custom",
        render: renderValue,
      },
    ];

    render(<EasySearchTable {...defaultProps} searchFields={customFields} />);

    expect(renderValue).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it("keeps date range fields shrinkable on narrow containers", () => {
    const dateFields: SearchFieldDef[] = [
      {
        key: "dateRange",
        labelKey: "Date",
        type: "dateRange",
        placeholder: "Pick date range",
      },
    ];

    renderWithI18n(
      <EasySearchTable
        {...defaultProps}
        searchFields={dateFields}
      />,
    );

    const dateTrigger = screen.getByRole("button", { name: /pick date range/i });
    expect(dateTrigger).toHaveClass("min-w-0", "max-w-full", "overflow-hidden");
  });

  it("simplifies pagination controls on mobile", () => {
    renderWithI18n(<EasySearchTable {...defaultProps} />);

    const total = screen.getByText("Total 3");
    expect(total.parentElement).toHaveClass("hidden", "sm:flex");

    const jump = screen.getByText("Go to");
    expect(jump.parentElement).toHaveClass("hidden", "sm:flex");

    expect(screen.getByText("Page 1 / 1")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    renderWithI18n(<EasySearchTable {...defaultProps} data={[]} total={0} />);

    const empty = document.querySelector('[data-slot="easy-search-table-empty"]');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent("No data");
    expect(empty).toHaveTextContent("No data matches the current search criteria.");
    expect(empty?.querySelector('[data-slot="empty-media"] svg')).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("supports a custom empty content slot", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const renderEmptyContent = vi.fn(({ view, reset }: EasySearchTableEmptyContext) => (
      <button type="button" onClick={reset}>Custom empty: {view}</button>
    ));

    render(
      <EasySearchTable
        {...defaultProps}
        data={[]}
        total={0}
        onSearch={onSearch}
        searchThrottleMs={0}
        renderEmptyContent={renderEmptyContent}
      />,
    );

    expect(screen.getByRole("button", { name: "Custom empty: table" })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="empty"]')).not.toBeInTheDocument();
    expect(renderEmptyContent).toHaveBeenCalledWith(expect.objectContaining({
      view: "table",
      searchValues: {},
      reset: expect.any(Function),
    }));

    await user.type(screen.getByPlaceholderText("Search name"), "Alice");
    onSearch.mockClear();
    await user.click(screen.getByRole("button", { name: "Custom empty: table" }));
    expect(onSearch).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  });

  it("supports custom renderExportContent", () => {
    const renderExportContent = (ctx: EasySearchTableExportContext<MockRecord>) => (
      <div data-testid="custom-export">
        <button type="button" onClick={ctx.close}>Close</button>
      </div>
    );
    render(
      <EasySearchTable
        {...defaultProps}
        showExport
        renderExportContent={renderExportContent}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("hides column when hidden is true", () => {
    const columnsWithHidden: ColumnDef<MockRecord>[] = [
      ...columns,
      { key: "secret", headerKey: "Secret", hidden: true },
    ];
    render(<EasySearchTable {...defaultProps} columns={columnsWithHidden} />);
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });
});
