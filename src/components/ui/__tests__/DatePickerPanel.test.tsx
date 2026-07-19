import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { EasyI18nProvider } from "@/i18n";
import { DatePickerPanel } from "../date-picker-panel";

function renderPanel(element: ReactElement) {
  return render(
    <EasyI18nProvider locale="zh-CN">{element}</EasyI18nProvider>,
  );
}

describe("DatePickerPanel", () => {
  it("switches from year to month to the date grid", async () => {
    const user = userEvent.setup();

    renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        startYear={2020}
        endYear={2030}
      />,
    );

    await user.click(screen.getByRole("button", { name: "2026年" }));
    await user.click(screen.getByRole("gridcell", { name: "2026" }));
    await user.click(screen.getByRole("gridcell", { name: "7月" }));

    expect(screen.getByRole("grid")).toHaveAttribute(
      "aria-label",
      "七月 2026",
    );
  });

  it("emits the first day for month and year picker types", async () => {
    const user = userEvent.setup();
    const onMonthSelect = vi.fn();
    const { unmount } = renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        onDateSelect={onMonthSelect}
        type="month"
      />,
    );

    await user.click(screen.getByRole("gridcell", { name: "8月" }));
    expect(onMonthSelect.mock.calls[0][0]).toEqual(new Date(2026, 7, 1, 12));

    unmount();
    const onYearSelect = vi.fn();
    renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        onDateSelect={onYearSelect}
        type="year"
      />,
    );
    await user.click(screen.getByRole("gridcell", { name: "2027" }));
    expect(onYearSelect.mock.calls[0][0]).toEqual(new Date(2027, 0, 1, 12));
  });

  it("disables fully unavailable months", () => {
    renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        disabledDate={(date) => date.getMonth() === 6}
        type="month"
      />,
    );

    expect(screen.getByRole("gridcell", { name: "7月" })).toBeDisabled();
    expect(screen.getByRole("gridcell", { name: "8月" })).not.toBeDisabled();
  });

  it("matches month and year disabled states to their emitted first day", () => {
    const { unmount } = renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        disabledDate={(date) => date.getDate() === 1}
        type="month"
      />,
    );

    expect(screen.getByRole("gridcell", { name: "7月" })).toBeDisabled();
    unmount();

    renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        disabledDate={(date) =>
          date.getFullYear() === 2026 &&
          date.getMonth() === 0 &&
          date.getDate() === 1
        }
        type="year"
      />,
    );

    expect(screen.getByRole("gridcell", { name: "2026" })).toBeDisabled();
    expect(screen.getByRole("gridcell", { name: "2027" })).not.toBeDisabled();
  });

  it("keeps panels content-sized and collapses extra range months on narrow screens", () => {
    const { container } = renderPanel(
      <DatePickerPanel
        defaultMonth={new Date(2026, 6, 1)}
        mode="range"
        numberOfMonths={2}
      />,
    );

    const root = container.querySelector('[data-slot="date-picker-panel"]');
    const panels = container.querySelectorAll("[data-panel-index]");
    expect(root).toHaveClass("w-fit");
    expect(root).not.toHaveClass("w-80");
    expect(panels).toHaveLength(2);
    expect(panels[0]).toHaveClass("w-[14.25rem]");
    expect(panels[1]).toHaveClass("max-sm:hidden");

    expect(
      within(panels[0] as HTMLElement).getByRole("button", { name: "上一年" }),
    ).toBeInTheDocument();
    expect(
      within(panels[0] as HTMLElement).queryByRole("button", {
        name: "下个月",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(panels[1] as HTMLElement).queryByRole("button", {
        name: "上一年",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(panels[1] as HTMLElement).getByRole("button", { name: "下一年" }),
    ).toBeInTheDocument();
    expect(
      within(panels[1] as HTMLElement).getByRole("button", { name: "下个月" }),
    ).toBeInTheDocument();

    screen.getAllByRole("button", { name: "2026年" }).forEach((button) => {
      expect(button).toHaveClass("whitespace-nowrap");
    });
    screen.getAllByRole("button", { name: "七月" }).forEach((button) => {
      expect(button).toHaveClass("whitespace-nowrap");
    });
  });

  it("uses one logical panel on narrow screens and can reach the final month", async () => {
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
      const { container } = renderPanel(
        <DatePickerPanel
          defaultMonth={new Date(2026, 10, 1)}
          endYear={2026}
          mode="range"
          numberOfMonths={2}
          startYear={2026}
        />,
      );

      expect(container.querySelectorAll("[data-panel-index]")).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: "下个月" }));
      expect(
        screen.getByRole("button", { name: "十二月" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "下个月" })).toBeDisabled();
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });
});
