import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field, FieldItem, FieldLabel } from "./field";

describe("Field", () => {
  it("默认以纵向布局渲染", () => {
    render(
      <Field>
        <FieldLabel>用户名</FieldLabel>
      </Field>,
    );

    const field = screen.getByText("用户名").closest("[data-slot=field]");
    expect(field).toHaveAttribute("data-orientation", "vertical");
    expect(field?.className).toContain("flex-col");
  });

  it("支持横向布局和自定义标签宽度", () => {
    render(
      <Field orientation="horizontal" labelWidth={120}>
        <FieldLabel>用户名</FieldLabel>
        <FieldItem>输入框</FieldItem>
      </Field>,
    );

    const field = screen.getByText("用户名").closest("[data-slot=field]");
    expect(field).toHaveAttribute("data-orientation", "horizontal");
    expect(field?.className).toContain(
      "[grid-template-columns:var(--field-label-width)",
    );
    expect(field?.className).toContain(
      "[&>[data-slot=field-label]]:justify-self-end",
    );
    expect(field?.className).toContain(
      "[&>[data-slot=field-label]]:self-start",
    );
    expect(field?.className).toContain("[&>[data-slot=field-label]]:pt-1.5");
    expect(field?.className).toContain("[&>[data-slot=field-label]]:leading-4");
    expect(field?.className).toContain("[&>[data-slot=field-label]]:max-w-full");
    expect(field).toHaveStyle("--field-label-width: 120px");
  });
});
