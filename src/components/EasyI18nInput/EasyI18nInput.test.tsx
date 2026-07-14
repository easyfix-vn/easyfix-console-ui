import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "@/i18n";
import { EasyI18nInput, type EasyI18nValue } from "./EasyI18nInput";

function renderInput(
  overrides: Partial<React.ComponentProps<typeof EasyI18nInput>> = {},
) {
  const value: EasyI18nValue = {
    primary: "维修服务",
    i18n: {
      "en-US": "Repair service",
      vi: "Dịch vụ sửa chữa",
    },
  };

  return render(
    <EasyI18nInput value={value} onChange={vi.fn()} {...overrides} />,
  );
}

describe("EasyI18nInput", () => {
  it("displays existing translations on the initial render", () => {
    const { container } = renderInput();

    expect(screen.getByDisplayValue("维修服务")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Repair service")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dịch vụ sửa chữa")).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-slot="easy-i18n-entry"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-slot="easy-i18n-locale-tab"]'),
    ).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "English" })).toBeInTheDocument();
  });

  it("supports textarea controls in the active tab", async () => {
    const user = userEvent.setup();
    renderInput({ type: "textarea" });

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getAllByRole("textbox").every((element) => element.tagName === "TEXTAREA")).toBe(true);

    await user.click(screen.getByRole("tab", { name: "English" }));
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByDisplayValue("Dịch vụ sửa chữa")).toBeInTheDocument();
  });

  it("uses the field label for the primary tab", () => {
    const { container } = renderInput({ label: "服务名称" });

    expect(
      container.querySelector('[data-slot="easy-i18n-primary-tab"]'),
    ).not.toHaveTextContent("服务名称");
  });

  it("localizes the default tab and generates fallback placeholder and tips", () => {
    render(
      <EasyI18nProvider locale="zh-CN">
        <EasyI18nInput
          label="服务名称"
          value={{ primary: "", i18n: { "en-US": "" } }}
          onChange={vi.fn()}
        />
      </EasyI18nProvider>,
    );

    expect(screen.getByRole("tab", { name: "默认" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("请输入服务名称 默认语言内容"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("请输入服务名称 English语言内容"),
    ).toBeInTheDocument();
    expect(screen.getByText("请输入服务名称 默认语言内容")).toBeInTheDocument();
  });

  it("uses supportLang to limit and order locale tabs", () => {
    const { container } = renderInput({ supportLang: ["en-US"] });

    expect(
      container.querySelectorAll('[data-slot="easy-i18n-locale-tab"]'),
    ).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "English" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Tiếng Việt" })).not.toBeInTheDocument();
  });

  it("keeps over-limit values and marks the active input invalid", async () => {
    const user = userEvent.setup();

    function ControlledInput(): React.ReactElement {
      const [value, setValue] = useState<EasyI18nValue>({
        primary: "",
        i18n: { "en-US": "" },
      });

      return (
        <EasyI18nInput
          label="服务名称"
          value={value}
          onChange={setValue}
          maxLength={3}
        />
      );
    }

    render(<ControlledInput />);

    const primaryInput = screen.getByRole("textbox");
    await user.type(primaryInput, "abcde");
    expect(primaryInput).toHaveValue("abcde");
    expect(primaryInput).toBeInvalid();

    await user.click(screen.getByRole("tab", { name: "English" }));
    const translationInput = screen.getByRole("textbox");
    await user.type(translationInput, "vwxyz");
    expect(translationInput).toHaveValue("vwxyz");
    expect(translationInput).toBeInvalid();
  });

  it("clears input values and removes translation tabs", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderInput({ onChange });

    await user.click(screen.getAllByTitle("i18nInput.clearValue")[0]);
    expect(onChange).toHaveBeenCalledWith({
      primary: "",
      i18n: {
        "en-US": "Repair service",
        vi: "Dịch vụ sửa chữa",
      },
    });

    await user.click(screen.getAllByTitle("i18nInput.removeLocale")[0]);
    expect(screen.getByText("i18nInput.confirmRemoveLocale")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "actions.cancel" }));
    expect(screen.getByDisplayValue("Dịch vụ sửa chữa")).toBeInTheDocument();

    await user.click(screen.getAllByTitle("i18nInput.removeLocale")[0]);
    await user.click(screen.getByRole("button", { name: "actions.confirm" }));
    expect(onChange).toHaveBeenLastCalledWith({
      primary: "维修服务",
      i18n: { "en-US": "Repair service" },
    });
  });

  it("switches the active translation with locale tabs", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(screen.getByRole("tab", { name: "Tiếng Việt" }));

    expect(screen.getByRole("tab", { name: "Tiếng Việt" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("adds a locale from the locale menu", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderInput({
      value: { primary: "维修服务", i18n: {} },
      onChange,
    });

    expect(container.querySelectorAll('[data-slot="easy-i18n-entry"]')).toHaveLength(0);
    await user.click(screen.getByTitle("i18nInput.addLocale"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "English" }));
    expect(onChange).toHaveBeenCalledWith({
      primary: "维修服务",
      i18n: { "en-US": "" },
    });
  });

  it("collapses and expands translations when all locales are present", async () => {
    const user = userEvent.setup();
    const { container } = renderInput({
      value: {
        primary: "维修服务",
        i18n: {
          "zh-CN": "维修服务",
          "en-US": "Repair service",
          vi: "Dịch vụ sửa chữa",
        },
      },
    });

    expect(container.querySelectorAll('[data-slot="easy-i18n-entry"]')).toHaveLength(3);
    await user.click(screen.getByTitle("i18nInput.collapseLocales"));
    expect(container.querySelectorAll('[data-slot="easy-i18n-entry"]')).toHaveLength(0);
    await user.click(screen.getByTitle("i18nInput.expandLocales"));
    expect(container.querySelectorAll('[data-slot="easy-i18n-entry"]')).toHaveLength(3);
  });
});
