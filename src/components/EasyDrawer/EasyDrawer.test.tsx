import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EasyDrawer } from "./EasyDrawer";

describe("EasyDrawer", () => {
  it("点击触发器后抽屉打开", async () => {
    const user = userEvent.setup();
    render(
      <EasyDrawer trigger={<button>打开抽屉</button>} title="测试标题">
        <p>抽屉内容</p>
      </EasyDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "打开抽屉" }));
    expect(await screen.findByText("测试标题")).toBeInTheDocument();
  });

  it("抽屉标题渲染正确", async () => {
    const user = userEvent.setup();
    render(
      <EasyDrawer trigger={<button>打开</button>} title="自定义标题">
        <p>内容</p>
      </EasyDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(await screen.findByText("自定义标题")).toBeInTheDocument();
  });

  it("关闭按钮可关闭抽屉", async () => {
    const user = userEvent.setup();
    render(
      <EasyDrawer trigger={<button>打开</button>} title="标题">
        <p>内容</p>
      </EasyDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(await screen.findByText("标题")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close drawer" }));
    await waitFor(() => {
      expect(screen.queryByText("标题")).not.toBeInTheDocument();
    });
  });

  it("抽屉内容正确渲染", async () => {
    const user = userEvent.setup();
    render(
      <EasyDrawer trigger={<button>打开</button>} title="标题">
        <p>这是抽屉的正文内容</p>
      </EasyDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(await screen.findByText("这是抽屉的正文内容")).toBeInTheDocument();
  });

  it("描述信息正确渲染", async () => {
    const user = userEvent.setup();
    render(
      <EasyDrawer
        trigger={<button>打开</button>}
        title="标题"
        description="这是描述"
      >
        <p>内容</p>
      </EasyDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(await screen.findByText("这是描述")).toBeInTheDocument();
  });

  it("footer 正确渲染", async () => {
    const user = userEvent.setup();
    render(
      <EasyDrawer
        trigger={<button>打开</button>}
        title="标题"
        footer={<button>确认</button>}
      >
        <p>内容</p>
      </EasyDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(
      await screen.findByRole("button", { name: "确认" }),
    ).toBeInTheDocument();
  });
});
