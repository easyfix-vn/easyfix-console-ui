import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "@/components/ui/config-provider";
import { ImageUpload, ImageUploadMultiple } from "./ImageUpload";

function renderWithProvider(ui: ReactElement) {
  return render(
    <ConfigProvider locale="en-US" theme="light">
      {ui}
    </ConfigProvider>,
  );
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("file input not found");
  }
  return input;
}

describe("ImageUpload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the application upload callback and returns the uploaded URL", async () => {
    const onChange = vi.fn();
    const onUploadingChange = vi.fn();
    const onUpload = vi.fn(async (file: File, folder?: string) => {
      expect(file.name).toBe("avatar.png");
      expect(folder).toBe("members/avatars");
      return "https://cdn.example/avatar.png";
    });
    const file = new File(["image"], "avatar.png", { type: "image/png" });

    const { container, rerender } = renderWithProvider(
      <ImageUpload
        value={null}
        onChange={onChange}
        onUpload={onUpload}
        onUploadingChange={onUploadingChange}
        folder="members/avatars"
        allowUrlInput={false}
      />,
    );

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("https://cdn.example/avatar.png"));
    expect(onUpload).toHaveBeenCalledWith(file, "members/avatars");
    expect(onUploadingChange).toHaveBeenNthCalledWith(1, true);
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);

    rerender(
      <ConfigProvider locale="en-US" theme="light">
        <ImageUpload
          value="https://cdn.example/avatar.png"
          onChange={onChange}
          onUpload={onUpload}
          allowUrlInput={false}
        />
      </ConfigProvider>,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://cdn.example/avatar.png",
    );
    expect(screen.getByRole("img")).toHaveClass(
      "h-auto",
      "w-auto",
      "max-h-full",
      "max-w-full",
      "object-contain",
    );
    expect(screen.getByRole("img")).not.toHaveClass("size-full", "object-cover");
    expect(screen.getByRole("img").parentElement).toHaveClass("overflow-hidden");
    expect(screen.getByRole("button", { name: "Replace image" })).toBeInTheDocument();
  });

  it("shows metadata text and uses built-in image formats by default", () => {
    const { container } = renderWithProvider(
      <ImageUpload
        value={null}
        onChange={vi.fn()}
        onUpload={vi.fn()}
        allowUrlInput={false}
      />,
    );

    expect(getFileInput(container)).toHaveAttribute(
      "accept",
      ".jpg,.jpeg,.png,.gif,.webp",
    );
    expect(screen.getByLabelText("Size 96 × 96 px").closest("button")).toHaveAttribute(
      "aria-label",
      "Upload image",
    );
    expect(screen.queryByLabelText("Formats JPG, JPEG, PNG, GIF, WEBP")).not.toBeInTheDocument();
    expect(screen.queryByText("JPG, JPEG, PNG, GIF, WEBP images are supported")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload image" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View upload tips" })).toBeInTheDocument();
  });

  it("shows a custom tip next to the hint icon", () => {
    renderWithProvider(
      <ImageUpload
        value={null}
        onChange={vi.fn()}
        onUpload={vi.fn()}
        tip="Use a square image for the best result"
        allowUrlInput={false}
      />,
    );

    expect(screen.getByText("Use a square image for the best result")).toBeInTheDocument();
  });

  it("uses custom accepted formats for the picker and validation", async () => {
    const onUpload = vi.fn(async () => "https://cdn.example/avatar.png");
    const file = new File(["image"], "avatar.jpg", { type: "image/jpeg" });
    const { container } = renderWithProvider(
      <ImageUpload
        value={null}
        onChange={vi.fn()}
        onUpload={onUpload}
        acceptedFormats={["png"]}
        allowUrlInput={false}
      />,
    );

    expect(getFileInput(container)).toHaveAttribute("accept", ".png");
    expect(screen.queryByLabelText("Formats PNG")).not.toBeInTheDocument();

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Only PNG image formats are supported",
      ),
    );
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uploads multiple images up to maxCount", async () => {
    const onChange = vi.fn();
    const onUpload = vi
      .fn<(file: File, folder?: string) => Promise<string>>()
      .mockResolvedValueOnce("https://cdn.example/one.png")
      .mockResolvedValueOnce("https://cdn.example/two.png");
    const first = new File(["one"], "one.png", { type: "image/png" });
    const second = new File(["two"], "two.png", { type: "image/png" });

    const { container } = renderWithProvider(
      <ImageUploadMultiple
        value={[]}
        onChange={onChange}
        onUpload={onUpload}
        maxCount={2}
        allowUrlInput={false}
      />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [first, second] },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        "https://cdn.example/one.png",
        "https://cdn.example/two.png",
      ]),
    );
    expect(onUpload).toHaveBeenCalledTimes(2);
  });

  it("supports URL input and custom previews", () => {
    const onChange = vi.fn();

    renderWithProvider(
      <ImageUpload
        value={["https://cdn.example/current.png"]}
        onChange={onChange}
        onUpload={vi.fn()}
        multiple
        showPreviewBorder={false}
        preview={(url) => <span data-testid="custom-preview">{url}</span>}
        emptyPreview={<span>Avatar</span>}
      />,
    );

    expect(screen.getByTestId("custom-preview")).toHaveTextContent(
      "https://cdn.example/current.png",
    );
    expect(screen.getByText("Avatar").closest("button")).toHaveClass("border-0");
    fireEvent.click(screen.getByRole("button", { name: "Edit image URL" }));
    const urlInput = screen.getByDisplayValue("https://cdn.example/current.png");
    fireEvent.change(urlInput, {
      target: { value: "https://cdn.example/updated.png" },
    });
    fireEvent.blur(urlInput);

    expect(onChange).toHaveBeenCalledWith(["https://cdn.example/updated.png"]);
  });

  it("reports upload errors without owning application notifications", async () => {
    const uploadError = new Error("network unavailable");
    const onUploadError = vi.fn();
    const onUpload = vi.fn(async () => {
      throw uploadError;
    });
    const file = new File(["image"], "avatar.png", { type: "image/png" });

    const { container } = renderWithProvider(
      <ImageUpload
        value={null}
        onChange={vi.fn()}
        onUpload={onUpload}
        onUploadError={onUploadError}
        allowUrlInput={false}
      />,
    );
    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("network unavailable"));
    expect(onUploadError).toHaveBeenCalledWith(uploadError);
  });
});
