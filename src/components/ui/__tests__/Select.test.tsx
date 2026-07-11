import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Cascader,
  SearchableSelect,
  type CascaderOption,
  type SelectOption,
} from "../select";

const options: SelectOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
];

describe("SearchableSelect", () => {
  it("filters options and commits selected value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SearchableSelect
        options={options}
        onValueChange={onValueChange}
        placeholder="选择框架"
      />,
    );

    await user.click(screen.getByText("选择框架"));
    await user.type(screen.getByPlaceholderText("搜索..."), "vu");
    await user.click(screen.getByText("Vue"));

    expect(onValueChange).toHaveBeenCalledWith("vue", options[1]);
  });

  it("supports custom fuzzy filter", async () => {
    const user = userEvent.setup();

    render(
      <SearchableSelect
        options={[
          { value: "beijing", label: "北京", searchText: "beijing" },
          { value: "shanghai", label: "上海", searchText: "shanghai" },
        ]}
        filter={(option, query) =>
          (option.searchText ?? "").toLowerCase().startsWith(query.toLowerCase())
        }
        placeholder="选择城市"
      />,
    );

    await user.click(screen.getByText("选择城市"));
    await user.type(screen.getByPlaceholderText("搜索..."), "bei");

    expect(screen.getByText("北京")).toBeInTheDocument();
    expect(screen.queryByText("上海")).not.toBeInTheDocument();
  });

  it("applies the search spacing to the input instead of the outer control", async () => {
    const user = userEvent.setup();

    render(<SearchableSelect options={options} placeholder="选择框架" />);

    await user.click(screen.getByText("选择框架"));

    const input = screen.getByPlaceholderText("搜索...");
    expect(input).toHaveClass("!ps-2");
  });
});

const cascaderOptions: CascaderOption[] = [
  {
    value: "china",
    label: "中国",
    children: [
      {
        value: "guangdong",
        label: "广东",
        children: [{ value: "shenzhen", label: "深圳" }],
      },
    ],
  },
];

describe("Cascader", () => {
  it("commits the selected leaf path", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Cascader
        options={cascaderOptions}
        onValueChange={onValueChange}
        placeholder="选择区域"
      />,
    );

    await user.click(screen.getByText("选择区域"));
    await user.click(screen.getByText("中国"));
    await user.click(screen.getByText("广东"));
    await user.click(screen.getByText("深圳"));

    expect(onValueChange).toHaveBeenCalledWith(
      ["china", "guangdong", "shenzhen"],
      [
        cascaderOptions[0],
        cascaderOptions[0].children?.[0],
        cascaderOptions[0].children?.[0].children?.[0],
      ],
    );
  });

  it("renders compact columns without horizontal panel scrolling", async () => {
    const user = userEvent.setup();

    render(<Cascader options={cascaderOptions} placeholder="选择区域" />);

    await user.click(screen.getByText("选择区域"));
    await user.click(screen.getByText("中国"));

    const panel = screen.getByRole("button", { name: "中国" }).closest(
      '[data-slot="cascader-panel"]',
    );

    expect(panel).toBeInTheDocument();
    expect(panel).not.toHaveClass("overflow-x-auto");
    expect(panel?.querySelectorAll('[data-slot="cascader-column"]')).toHaveLength(2);
  });
});
