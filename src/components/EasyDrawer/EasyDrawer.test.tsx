import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  EasyDrawer,
  EasyDrawerPopup,
  EasyDrawerRoot,
} from "./EasyDrawer";

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

  it("Popup 和遮罩具有一致的进入与退出动画契约", () => {
    render(
      <EasyDrawerRoot open>
        <EasyDrawerPopup position="right" showCloseButton={false}>
          <p>动画内容</p>
        </EasyDrawerPopup>
      </EasyDrawerRoot>,
    );

    const popup = document.querySelector('[data-slot="easy-drawer-popup"]');
    const backdrop = document.querySelector('[data-slot="easy-drawer-backdrop"]');

    expect(popup).toHaveClass(
      "transition-[transform,opacity]",
      "duration-450",
      "data-starting-style:opacity-0",
      "data-ending-style:opacity-0",
      "transform-[translateX(var(--drawer-swipe-movement-x))]",
      "data-starting-style:transform-[translateX(100%)]",
      "data-ending-style:transform-[translateX(100%)]",
    );
    expect(backdrop).toHaveClass(
      "transition-opacity",
      "duration-450",
      "data-starting-style:opacity-0",
      "data-ending-style:opacity-0",
    );
  });

  it.each(["right", "left"] as const)(
    "%s 方向保留视口外边距和圆角",
    (position) => {
      render(
        <EasyDrawerRoot open>
          <EasyDrawerPopup position={position} showCloseButton={false}>
            <p>布局内容</p>
          </EasyDrawerPopup>
        </EasyDrawerRoot>,
      );

      expect(
        document.querySelector('[data-slot="easy-drawer-viewport"]'),
      ).toHaveClass("p-3", "sm:p-4");
      expect(
        document.querySelector('[data-slot="easy-drawer-popup"]'),
      ).toHaveClass("h-full", "w-full", "rounded-2xl");
    },
  );

  it.each([
    [
      "right",
      "transform-[translateX(var(--drawer-swipe-movement-x))]",
      "data-starting-style:transform-[translateX(100%)]",
    ],
    [
      "left",
      "transform-[translateX(var(--drawer-swipe-movement-x))]",
      "data-starting-style:transform-[translateX(-100%)]",
    ],
    [
      "bottom",
      "transform-[translateY(var(--drawer-swipe-movement-y))]",
      "data-starting-style:transform-[translateY(100%)]",
    ],
    [
      "top",
      "transform-[translateY(var(--drawer-swipe-movement-y))]",
      "data-starting-style:transform-[translateY(-100%)]",
    ],
  ] as const)("%s 方向使用正确的进入位移", (position, movementClass, transitionClass) => {
    render(
      <EasyDrawerRoot open>
        <EasyDrawerPopup position={position} showCloseButton={false}>
          <p>动画内容</p>
        </EasyDrawerPopup>
      </EasyDrawerRoot>,
    );

    expect(document.querySelector('[data-slot="easy-drawer-popup"]')).toHaveClass(
      "transition-[transform,opacity]",
      movementClass,
      transitionClass,
    );
  });
});
