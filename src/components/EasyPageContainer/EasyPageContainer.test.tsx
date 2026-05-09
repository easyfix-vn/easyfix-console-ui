import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EasyPageContainer } from "./EasyPageContainer";

describe("EasyPageContainer", () => {
  it("渲染子内容", () => {
    render(
      <EasyPageContainer>
        <p>页面内容</p>
      </EasyPageContainer>,
    );
    expect(screen.getByText("页面内容")).toBeInTheDocument();
  });

  it("渲染 header", () => {
    render(
      <EasyPageContainer header={<h1>页面标题</h1>}>
        <p>内容</p>
      </EasyPageContainer>,
    );
    expect(screen.getByText("页面标题")).toBeInTheDocument();
    expect(
      screen.getByText("页面标题").closest("[data-slot='easy-page-header']"),
    ).toBeInTheDocument();
  });

  it("渲染 footer", () => {
    render(
      <EasyPageContainer footer={<div>页脚内容</div>}>
        <p>内容</p>
      </EasyPageContainer>,
    );
    expect(screen.getByText("页脚内容")).toBeInTheDocument();
    expect(
      screen.getByText("页脚内容").closest("[data-slot='easy-page-footer']"),
    ).toBeInTheDocument();
  });

  it("className 正确传递", () => {
    const { container } = render(
      <EasyPageContainer className="custom-class">
        <p>内容</p>
      </EasyPageContainer>,
    );
    const section = container.querySelector("section");
    expect(section?.className).toContain("custom-class");
  });

  it("contentClassName 正确传递到内容容器", () => {
    render(
      <EasyPageContainer contentClassName="content-custom">
        <p>内容</p>
      </EasyPageContainer>,
    );
    const contentWrapper = screen.getByText("内容").parentElement;
    expect(contentWrapper?.className).toContain("content-custom");
  });

  it("不传 header 时不渲染 header 容器", () => {
    const { container } = render(
      <EasyPageContainer>
        <p>内容</p>
      </EasyPageContainer>,
    );
    expect(
      container.querySelector("[data-slot='easy-page-header']"),
    ).not.toBeInTheDocument();
  });
});
