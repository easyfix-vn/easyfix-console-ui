import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EasyHolidayScheduleView,
  validateHolidaySchedule,
} from "./EasyHolidaySchedule";

describe("EasyHolidaySchedule", () => {
  it("validates required dates, ordered end date, and ranges", () => {
    expect(
      validateHolidaySchedule({
        version: 1,
        items: [
          { date: "", name: "No date", closed: true },
          { date: "2026-02-03", end_date: "2026-02-01", name: "Bad range", closed: true },
          { date: "2026-02-04", name: "Open", closed: false, ranges: [] },
        ],
      }),
    ).toEqual([
      { index: 0, field: "date" },
      { index: 1, field: "end_date" },
      { index: 2, field: "ranges" },
    ]);
  });

  it("sorts items in readonly view", () => {
    render(
      <EasyHolidayScheduleView
        value={{
          version: 1,
          items: [
            { date: "2026-05-02", name: "Second", closed: true },
            { date: "2026-05-01", name: "First", closed: false, ranges: [{ open: "10:00", close: "16:00" }] },
          ],
        }}
      />,
    );

    const rows = screen.getAllByText(/2026-05/).map((node) => node.textContent);
    expect(rows).toEqual(["2026-05-01", "2026-05-02"]);
    expect(screen.getByText("10:00-16:00")).toBeInTheDocument();
  });
});
