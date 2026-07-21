import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EasyOpeningHoursView,
  formatRanges,
  validateOpeningHours,
} from "./EasyOpeningHours";

const validValue = {
  version: 1 as const,
  weekly: [{ days: [1, 2], ranges: [{ open: "09:00", close: "18:00" }] }],
};

describe("EasyOpeningHours", () => {
  it("validates duplicated days and invalid ranges", () => {
    const result = validateOpeningHours({
      version: 1,
      weekly: [
        { days: [1], ranges: [{ open: "09:00", close: "18:00" }] },
        { days: [1], ranges: [{ open: "18:00", close: "09:00" }] },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.dayConflicts).toEqual([1]);
    expect(result.rangeErrors).toEqual([{ ruleIndex: 1, rangeIndex: 0 }]);
  });

  it("renders weekly view with closed days", () => {
    render(<EasyOpeningHoursView value={validValue} />);

    expect(screen.getAllByText("09:00-18:00")).toHaveLength(2);
    expect(screen.getAllByText("openingHours.closed")).toHaveLength(5);
    expect(formatRanges(validValue.weekly[0].ranges)).toBe("09:00-18:00");
  });
});
