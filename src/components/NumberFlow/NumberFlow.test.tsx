import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NumberFlow } from "./NumberFlow";

describe("NumberFlow", () => {
  it("formats values with Intl options", () => {
    render(
      <NumberFlow
        animated={false}
        value={1280.5}
        locales="en-US"
        format={{ style: "currency", currency: "USD" }}
      />,
    );

    expect(screen.getByLabelText("$1,280.50")).toBeInTheDocument();
  });

  it("renders prefix and suffix", () => {
    render(
      <NumberFlow
        animated={false}
        prefix="+"
        suffix="%"
        value={12.5}
        format={{ maximumFractionDigits: 1 }}
      />,
    );

    expect(screen.getByLabelText("+12.5%")).toBeInTheDocument();
  });

  it("applies explicit variant", () => {
    render(<NumberFlow animated={false} value={42} variant="success" />);

    expect(screen.getByLabelText("42")).toHaveAttribute(
      "data-slot",
      "number-flow",
    );
  });

  it("reserves the final formatted width before the mount animation", () => {
    render(
      <NumberFlow
        value={1280.5}
        locales="en-US"
        format={{ style: "currency", currency: "USD" }}
      />,
    );

    expect(screen.getByLabelText("$1,280.50")).toHaveStyle({
      minInlineSize: "9ch",
    });
  });
});
