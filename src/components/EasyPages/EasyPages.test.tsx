import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "@/i18n";
import type { EasySearchTableProps } from "@/components/EasySearchTable/EasySearchTable";
import type { EasyTabItem } from "@/components/EasyTabContainer/EasyTabContainer";
import { EasyDetailPage, EasyPageSection, EasySearchTablePage, EasyTabPage } from "./index";

const items: EasyTabItem[] = [
  { value: "disabled", label: "Unavailable", content: "Unavailable content", disabled: true },
  { value: "overview", label: "Overview", content: "Overview content" },
  { value: "activity", label: "Activity", content: "Activity content" },
];

describe("EasyTabPage", () => {
  it("defaults to the first enabled tab and supports keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<EasyTabPage title="Workspace" items={items} />);

    expect(screen.getByRole("heading", { level: 1, name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview content");
    await user.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Activity content");
  });

  it("preserves controlled tab state and forwards value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function ControlledPage() {
      const [value, setValue] = useState("activity");
      return (
        <EasyTabPage
          title="Workspace"
          items={items}
          tabsProps={{
            value,
            onValueChange: (nextValue, details) => {
              onValueChange(nextValue, details);
              setValue(String(nextValue));
            },
          }}
        />
      );
    }
    render(<ControlledPage />);

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Activity content");
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    expect(onValueChange).toHaveBeenCalledWith("overview", expect.any(Object));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview content");
    await user.click(screen.getByRole("tab", { name: "Unavailable" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

type RecordItem = { id: string; name: string };

function tableProps(onSearch = vi.fn()): EasySearchTableProps<RecordItem> {
  return {
    columns: [{ key: "name", headerKey: "Name" }],
    searchFields: [{ key: "name", labelKey: "Name", type: "input", placeholder: "Search name" }],
    searchMode: "manual",
    searchThrottleMs: 0,
    data: [{ id: "1", name: "Alice" }],
    total: 1,
    page: 1,
    pageSize: 10,
    showExport: false,
    onSearch,
  };
}

describe("EasySearchTablePage", () => {
  it("forwards search and reset without owning table state", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <EasyI18nProvider locale="en-US">
        <EasySearchTablePage title="Members" tableProps={tableProps(onSearch)} />
      </EasyI18nProvider>,
    );

    expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search name"), "Alice");
    expect(onSearch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, name: "Alice" });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(onSearch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
    expect(screen.getByPlaceholderText("Search name")).toHaveValue("");
  });

  it("preserves custom empty content and page actions", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <EasySearchTablePage
        title="Members"
        actions={<button onClick={onCreate}>Create member</button>}
        summary={<p>No members yet</p>}
        tableProps={{
          ...tableProps(),
          data: [],
          total: 0,
          renderEmptyContent: () => <p>Invite your first member</p>,
        }}
      />,
    );

    expect(screen.getByText("Invite your first member")).toBeInTheDocument();
    expect(screen.getByText("No members yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create member" }));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});

describe("EasyDetailPage", () => {
  it("provides a named section and complementary content without duplicate page titles", () => {
    render(
      <EasyDetailPage
        title="Order details"
        status={<span>In progress</span>}
        summary={<p>Order EF-2026</p>}
        aside={<EasyPageSection title="Customer">Customer information</EasyPageSection>}
        footer={<button>Save changes</button>}
      >
        <EasyPageSection title="Service information" description="Requested repair details">
          Screen replacement
        </EasyPageSection>
      </EasyDetailPage>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Service information" })).toHaveTextContent("Screen replacement");
    expect(screen.getByRole("complementary")).toHaveTextContent("Customer information");
    expect(screen.getByRole("heading", { level: 2, name: "Customer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
