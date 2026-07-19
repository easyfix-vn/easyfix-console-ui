import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "../config-provider";
import { DateRangePicker } from "../date-range-picker";

const timeZone = "America/Los_Angeles";

function renderRangePicker(
  props: React.ComponentProps<typeof DateRangePicker> = {},
  locale: "zh-CN" | "vi" = "zh-CN",
) {
  return render(
    <ConfigProvider locale={locale} theme="light" timeZone={timeZone}>
      <DateRangePicker
        defaultValue={new Date("2026-07-15T19:00:00.000Z")}
        numberOfMonths={2}
        shortcuts={false}
        showTimeZone={false}
        timeZone={timeZone}
        {...props}
      />
    </ConfigProvider>,
  );
}

describe("DateRangePicker hierarchy", () => {
  it("keeps shortcuts on one horizontal row above the calendar on narrow screens", async () => {
    const user = userEvent.setup();
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === "(max-width: 639px)",
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    });

    try {
      const { container } = renderRangePicker({ shortcuts: undefined });
      await user.click(screen.getByRole("button", { name: "选择日期范围" }));

      expect(screen.getByRole("dialog")).toHaveClass("w-[14.25rem]");
      const layout = container.ownerDocument.querySelector(
        '[data-slot="date-range-picker-layout"]',
      );
      const shortcutPanel = container.ownerDocument.querySelector(
        '[data-slot="date-range-picker-shortcuts"]',
      );
      const calendarPanel = container.ownerDocument.querySelector(
        '[data-slot="date-range-picker-calendar"]',
      );

      expect(layout).toHaveClass("flex-col");
      expect(shortcutPanel).toHaveClass(
        "flex",
        "w-full",
        "overflow-x-auto",
        "border-b",
      );
      expect(shortcutPanel).not.toHaveClass("w-28", "border-r");
      expect(calendarPanel).toHaveClass("w-full");
      within(shortcutPanel as HTMLElement)
        .getAllByRole("button")
        .forEach((button) => {
          expect(button).toHaveClass("shrink-0", "whitespace-nowrap");
        });
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it("places start and end time in two compact columns on narrow screens", async () => {
    const user = userEvent.setup();
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === "(max-width: 639px)",
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    });

    try {
      const { container } = renderRangePicker({ showTime: true }, "vi");
      await user.click(
        screen.getByRole("button", { name: "Chọn khoảng ngày-giờ" }),
      );

      const footer = container.ownerDocument.querySelector(
        '[data-slot="date-range-picker-footer"]',
      );
      const timeGrid = container.ownerDocument.querySelector(
        '[data-slot="date-range-picker-time-grid"]',
      );
      const timePanels = within(footer as HTMLElement).getAllByRole("group");
      expect(footer).toHaveClass("flex-nowrap", "flex-col", "items-stretch");
      expect(timeGrid).toHaveClass(
        "grid",
        "w-full",
        "min-w-0",
        "grid-cols-2",
      );
      expect(timePanels).toHaveLength(2);
      timePanels.forEach((panel) => {
        expect(panel).toHaveAttribute("data-orientation", "compact");
        expect(panel).toHaveClass(
          "w-full",
          "flex-col",
          "items-stretch",
        );
        expect(
          panel.querySelector('[data-slot="time-picker-panel-label"]'),
        ).toHaveClass("w-full", "min-w-0", "overflow-hidden");
        expect(
          panel.querySelector('[data-slot="time-picker-panel-fields"]'),
        ).toHaveClass("w-full", "shrink-0", "whitespace-nowrap", "gap-0.5");
      });
      const timeFields = within(footer as HTMLElement).getAllByRole("combobox");
      expect(timeFields).toHaveLength(4);
      timeFields.forEach((field) => {
        expect(field).toHaveClass(
          "h-7",
          "min-h-7",
          "w-10",
          "text-sm",
          "gap-0.5",
          "[&_[data-slot=select-icon]_svg]:me-0",
          "[&_[data-slot=select-icon]_svg]:size-3",
        );
        expect(field.querySelector('[data-slot="select-icon"]')).toHaveClass(
          "inline-flex",
          "self-center",
          "items-center",
          "justify-center",
          "leading-none",
        );
      });
      expect(
        container.ownerDocument.querySelector(
          '[data-slot="date-range-picker-time-separator"]',
        ),
      ).not.toBeInTheDocument();
      expect(
        within(footer as HTMLElement).getByRole("button", { name: "Xác nhận" }),
      ).toHaveClass("h-9", "w-full");
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it("keeps seconds selectors dense and unwrapped in the narrow time grid", async () => {
    const user = userEvent.setup();
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === "(max-width: 639px)",
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    });

    try {
      const { container } = renderRangePicker(
        { showSeconds: true, showTime: true },
        "vi",
      );
      await user.click(
        screen.getByRole("button", { name: "Chọn khoảng ngày-giờ" }),
      );

      const timeGrid = container.ownerDocument.querySelector(
        '[data-slot="date-range-picker-time-grid"]',
      );
      const fields = within(timeGrid as HTMLElement).getAllByRole("combobox");
      expect(fields).toHaveLength(6);
      fields.forEach((field) => {
        expect(field).toHaveClass(
          "h-7",
          "min-h-7",
          "w-7",
          "text-xs",
          "gap-0",
          "[&_[data-slot=select-icon]]:hidden",
        );
      });
      within(timeGrid as HTMLElement)
        .getAllByRole("group")
        .forEach((panel) => {
          expect(
            panel.querySelector('[data-slot="time-picker-panel-fields"]'),
          ).toHaveClass("w-full", "whitespace-nowrap", "gap-px");
        });
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it("keeps time controls inline and the popup content-sized on desktop", async () => {
    const user = userEvent.setup();
    const { container } = renderRangePicker({ showTime: true });
    await user.click(
      screen.getByRole("button", { name: "选择日期时间范围" }),
    );

    expect(screen.getByRole("dialog")).toHaveClass("w-auto");
    const footer = container.ownerDocument.querySelector(
      '[data-slot="date-range-picker-footer"]',
    );
    within(footer as HTMLElement)
      .getAllByRole("group")
      .forEach((panel) => {
        expect(panel).toHaveAttribute("data-orientation", "horizontal");
      });
    expect(
      within(footer as HTMLElement).getByRole("button", { name: "确定" }),
    ).not.toHaveClass("w-full");
  });

  it("truncates desktop shortcuts and reveals the full label in a tooltip", async () => {
    const user = userEvent.setup();
    const shortcutLabel = "Một khoảng thời gian có nhãn rất dài";
    const { container } = renderRangePicker(
      {
        shortcuts: [
          {
            label: shortcutLabel,
            getRange: () => ({
              from: new Date("2026-07-06T07:00:00.000Z"),
              to: new Date("2026-07-12T06:59:59.999Z"),
            }),
          },
        ],
      },
      "vi",
    );

    await user.click(screen.getByRole("button", { name: "Chọn khoảng ngày" }));

    const shortcut = container.ownerDocument.querySelector(
      '[data-slot="date-range-picker-shortcut"]',
    );
    expect(shortcut).toHaveClass(
      "w-full",
      "overflow-hidden",
      "whitespace-nowrap",
    );
    expect(shortcut?.firstElementChild).toHaveClass("truncate");

    expect(shortcut).toHaveAttribute("data-base-ui-tooltip-trigger");
    await user.hover(shortcut as HTMLElement);
    await waitFor(() => {
      expect(
        container.ownerDocument.querySelector('[data-slot="tooltip-popup"]'),
      ).toHaveTextContent(shortcutLabel);
    });
  });

  it("switches each linked range panel through year and month views", async () => {
    const user = userEvent.setup();
    renderRangePicker();

    await user.click(screen.getByRole("button", { name: "选择日期范围" }));

    const initialYearButtons = screen.getAllByRole("button", { name: "2026年" });
    expect(initialYearButtons).toHaveLength(2);
    await user.click(initialYearButtons[0]);
    await user.click(screen.getByRole("gridcell", { name: "2026" }));
    await user.click(screen.getByRole("gridcell", { name: "9月" }));

    expect(screen.getByRole("grid", { name: "九月 2026" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "十月 2026" })).toBeInTheDocument();

    const linkedYearButtons = screen.getAllByRole("button", { name: "2026年" });
    await user.click(linkedYearButtons[1]);
    expect(screen.getByRole("gridcell", { name: "2026" })).toBeInTheDocument();
  });

  it("disables a month only when all of its dates are unavailable", async () => {
    const user = userEvent.setup();
    renderRangePicker({
      disabledDate: (date) =>
        date.getFullYear() === 2026 && date.getMonth() === 8,
    });

    await user.click(screen.getByRole("button", { name: "选择日期范围" }));
    await user.click(screen.getAllByRole("button", { name: "七月" })[0]);

    expect(screen.getByRole("gridcell", { name: "9月" })).toBeDisabled();
    expect(screen.getByRole("gridcell", { name: "10月" })).not.toBeDisabled();
  });

  it("keeps range selection shared across the linked month panels", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRangePicker({ onChange });

    await user.click(screen.getByRole("button", { name: "选择日期范围" }));
    const julyGrid = screen.getByRole("grid", { name: "七月 2026" });
    const augustGrid = screen.getByRole("grid", { name: "八月 2026" });
    await user.click(
      within(julyGrid).getByRole("button", { name: /2026年7月28日/ }),
    );
    await user.click(
      within(augustGrid).getByRole("button", { name: /2026年8月3日/ }),
    );
    await user.click(screen.getByRole("button", { name: "确定" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0][0];
    expect(range.from.toISOString()).toBe("2026-07-28T07:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-08-04T06:59:59.999Z");
  });
});
