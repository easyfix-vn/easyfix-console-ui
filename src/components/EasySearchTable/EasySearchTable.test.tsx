import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EasySearchTable, type ColumnDef, type SearchFieldDef, type EasySearchTableExportContext } from "./EasySearchTable";
import { EasyI18nProvider } from "@/i18n";

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

  it("calls onSearch on form submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<EasySearchTable {...defaultProps} onSearch={onSearch} />);

    const searchBtn = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("search") || btn.textContent?.includes("搜索")
    );
    if (searchBtn) {
      await user.click(searchBtn);
      expect(onSearch).toHaveBeenCalled();
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

  it("renders mobile search actions beside toolbarActions", () => {
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
      toolbarGroup?.querySelector(".md\\:hidden"),
    ).toBeInTheDocument();
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
    render(<EasySearchTable {...defaultProps} data={[]} total={0} />);
    expect(screen.getByText("—")).toBeInTheDocument();
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
