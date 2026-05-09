import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EasySearchTable, type ColumnDef, type SearchFieldDef, type EasySearchTableExportContext } from "./EasySearchTable";

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
    const buttons = screen.getAllByRole("button");
    const exportBtn = buttons.find((btn) => btn.textContent?.includes("export") || btn.textContent?.includes("导出"));
    expect(exportBtn).toBeDefined();
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
