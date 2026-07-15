import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EasyGlobalPhoneInput } from "./EasyGlobalPhoneInput";

describe("EasyGlobalPhoneInput", () => {
  it("默认不允许清空已选择的区号", () => {
    render(
      <EasyGlobalPhoneInput
        cc="84"
        phone=""
        onCcChange={vi.fn()}
        onPhoneChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("清空")).not.toBeInTheDocument();
    expect(document.querySelector("[data-slot=select-icon]")).toBeInTheDocument();
  });
});
