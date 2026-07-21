import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EasyGlobalPhoneInput } from "./EasyGlobalPhoneInput";
import { validatePhone } from "./presets";

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

  it("验证越南号码为 9 位且不以 0 开头", () => {
    expect(validatePhone("84", "912345678")).toBeUndefined();
    expect(validatePhone("84", "091234567")).toBe(
      "globalPhone.noLeadingZero",
    );
    expect(validatePhone("84", "9123456789")).toBe(
      "globalPhone.invalidLength",
    );
  });
});
