import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  EasyDialog,
  EasyDialogRoot,
  EasyDialogTrigger,
  EasyDialogPopup,
  EasyDialogHeader,
  EasyDialogTitle,
  EasyDialogBody,
  EasyDialogFooter,
  EasyDialogClose,
} from "./EasyDialog";
import { EasyButton } from "@/components/EasyButton";

describe("EasyDialog", () => {
  it("renders trigger and opens on click", async () => {
    const user = userEvent.setup();
    render(
      <EasyDialog
        trigger={<EasyButton>Open</EasyButton>}
        title="Test Dialog"
      >
        <p>Dialog body</p>
      </EasyDialog>,
    );

    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByText("Test Dialog")).toBeInTheDocument(),
    );
  });

  it("renders description", async () => {
    const user = userEvent.setup();
    render(
      <EasyDialog
        trigger={<EasyButton>Open</EasyButton>}
        title="Title"
        description="A description"
      >
        <p>Body</p>
      </EasyDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByText("A description")).toBeInTheDocument(),
    );
  });

  it("renders footer", async () => {
    const user = userEvent.setup();
    render(
      <EasyDialog
        trigger={<EasyButton>Open</EasyButton>}
        title="Title"
        footer={<EasyButton>Save</EasyButton>}
      >
        <p>Body</p>
      </EasyDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument(),
    );
  });

  it("renders composable API", async () => {
    const user = userEvent.setup();
    render(
      <EasyDialogRoot>
        <EasyDialogTrigger render={<EasyButton>Open</EasyButton>} />
        <EasyDialogPopup size="lg">
          <EasyDialogHeader>
            <EasyDialogTitle>Custom Title</EasyDialogTitle>
          </EasyDialogHeader>
          <EasyDialogBody>Body content</EasyDialogBody>
          <EasyDialogFooter>
            <EasyDialogClose render={<EasyButton>Close</EasyButton>} />
          </EasyDialogFooter>
        </EasyDialogPopup>
      </EasyDialogRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByText("Custom Title")).toBeInTheDocument(),
    );
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("applies width prop as inline style", async () => {
    const user = userEvent.setup();
    render(
      <EasyDialogRoot>
        <EasyDialogTrigger render={<EasyButton>Open</EasyButton>} />
        <EasyDialogPopup width="800px">
          <EasyDialogBody>Content</EasyDialogBody>
        </EasyDialogPopup>
      </EasyDialogRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByText("Content")).toBeInTheDocument(),
    );
    const popup = screen.getByText("Content").closest("[data-slot='easy-dialog-popup']");
    expect(popup).toHaveStyle({ maxWidth: "800px" });
  });
});
