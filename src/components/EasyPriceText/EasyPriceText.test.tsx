import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EasyPriceText } from "./EasyPriceText";
import {
  formatPriceInputValue,
  formatPriceText,
} from "./price-format";

describe("EasyPriceText", () => {
  it("formats VND with grouping and zero fraction digits by default", () => {
    render(<EasyPriceText value={1280000} />);
    expect(screen.getByText("1,280,000 VND")).toBeInTheDocument();
  });

  it("formats currencies with custom unit placement", () => {
    render(
      <EasyPriceText
        value={1280.5}
        currency="USD"
        unitPosition="prefix"
      />,
    );

    expect(screen.getByText("USD 1,280.50")).toBeInTheDocument();
  });

  it("supports custom grouping separator and unit text", () => {
    expect(
      formatPriceText(1280000, {
        currency: "VND",
        groupSeparator: ".",
        unitText: "d",
      }),
    ).toBe("1.280.000 d");
  });

  it("keeps draft input decimals while formatting", () => {
    expect(
      formatPriceInputValue("1234.5", {
        precision: 2,
      }),
    ).toBe("1,234.5");
  });
});
