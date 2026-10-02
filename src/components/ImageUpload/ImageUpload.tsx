"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ImageUpIcon,
  ImagePlus,
  Info,
  Pencil,
  Scaling,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  Input,
  Popconfirm,
  Spinner,
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui";
import { useEasyT } from "@/i18n";
import { cn } from "@/lib/utils";
import { DEFAULT_IMAGE_UPLOAD_FORMATS } from "./constants";

export type ImageUploadSize = "sm" | "md" | "lg" | number;

export type ImageUploadPreview =
  | ReactNode
  | ((url: string, index: number) => ReactNode);

/** 应用层上传适配器：组件库不感知具体 HTTP API 或响应结构。 */
export type ImageUploadHandler = (file: File, folder?: string) => Promise<string>;

export type ImageUploadErrorHandler = (error: unknown) => void;

type ImageSizeStyle = {
  className: string;
  style?: { width: number; height: number };
};

type ImageItem = {
  id: string;
  url: string;
};

let nextImageItemId = 0;

function createImageItem(url: string): ImageItem {
  nextImageItemId += 1;
  return { id: `image-upload-${nextImageItemId}`, url };
}

function normalizeImageUrls(urls: string[]): string[] {
  return urls.filter((url) => url.trim().length > 0);
}

function reconcileImageItems(previous: ImageItem[], urls: string[]): ImageItem[] {
  const unused = [...previous];
  return normalizeImageUrls(urls).map((url) => {
    const existingIndex = unused.findIndex((item) => item.url === url);
    if (existingIndex < 0) return createImageItem(url);
    const [existing] = unused.splice(existingIndex, 1);
    return existing;
  });
}

function resolveImageSize(size: ImageUploadSize): ImageSizeStyle {
  if (typeof size === "number") {
    return { className: "shrink-0", style: { width: size, height: size } };
  }
  const className = { sm: "size-16", md: "size-24", lg: "size-32" }[size];
  return { className: `${className} shrink-0` };
}

function resolveImageSizePixels(size: ImageUploadSize): number {
  if (typeof size === "number") return size;
  return { sm: 64, md: 96, lg: 128 }[size];
}

function normalizeAcceptedFormats(formats?: readonly string[]): string[] {
  const source = formats?.length ? formats : DEFAULT_IMAGE_UPLOAD_FORMATS;
  const normalized = source
    .map((format) => format.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);

  return [...new Set(normalized)];
}

function formatAcceptedFormats(formats: readonly string[]): string {
  return formats.map((format) => format.toUpperCase()).join(", ");
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot < 0 ? "" : fileName.slice(lastDot + 1).toLowerCase();
}

function matchesAcceptedFormat(file: File, acceptedFormats: readonly string[]): boolean {
  const fileType = file.type.toLowerCase().split(";", 1)[0];
  const fileExtension = getFileExtension(file.name);

  return acceptedFormats.some((format) => {
    if (format === "*" || format === "image/*") {
      return fileType.startsWith("image/");
    }
    if (format.includes("/")) {
      return fileType === format;
    }
    const mimeType = `image/${format === "jpg" ? "jpeg" : format}`;
    return fileExtension === format || fileType === mimeType;
  });
}

function validateImage(
  file: File,
  maxFileSizeBytes: number,
  imageOnlyMessage: string,
  unsupportedFormatMessage: string,
  fileTooLargeMessage: string,
  acceptedFormats: readonly string[],
): string | null {
  if (!file.type.startsWith("image/")) return imageOnlyMessage;
  if (!matchesAcceptedFormat(file, acceptedFormats)) return unsupportedFormatMessage;
  if (file.size > maxFileSizeBytes) return fileTooLargeMessage;
  return null;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isValidImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

type UploadSizeMetaProps = {
  sizeLabel: string;
  sizeAriaLabel: string;
};

function UploadSizeMeta({
  sizeLabel,
  sizeAriaLabel,
}: UploadSizeMetaProps) {
  return (
    <span className="flex w-full items-center justify-center px-3 text-center text-xs leading-4 text-muted-foreground">
      <span className="flex max-w-full items-center justify-center gap-1" aria-label={sizeAriaLabel}>
        <Scaling className="size-3 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">{sizeLabel}</span>
      </span>
    </span>
  );
}

type UploadHintProps = {
  hint: ReactNode;
  hintLabel: string;
  sizeHint: string;
  formatsHint: string;
  sizePixels: number;
  multiple: boolean;
  count: number;
  maxCount: number;
};

function UploadHint({
  hint,
  hintLabel,
  sizeHint,
  formatsHint,
  sizePixels,
  multiple,
  count,
  maxCount,
}: UploadHintProps) {
  return (
    <div
      className="flex min-w-0 max-w-full items-center gap-1.5 text-xs leading-4 text-muted-foreground"
      style={multiple ? undefined : { width: sizePixels }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label={hintLabel}
            />
          }
        >
          <Info className="size-3.5" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipPopup side="top" align="start">
          <div className="max-w-xs space-y-1 whitespace-normal break-words">
            {hint ? <div>{hint}</div> : null}
            <div>{sizeHint}</div>
            <div>{formatsHint}</div>
          </div>
        </TooltipPopup>
      </Tooltip>
      {hint ? (
        <span
          className="min-w-0 flex-1 truncate"
          title={typeof hint === "string" ? hint : undefined}
        >
          {hint}
        </span>
      ) : null}
      {multiple ? (
        <span className="shrink-0 text-muted-foreground/75">
          ({count}/{maxCount})
        </span>
      ) : null}
    </div>
  );
}

type ImageUploadBaseProps = {
  /** 上传文件并返回最终可访问的图片 URL。 */
  onUpload: ImageUploadHandler;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadError?: ImageUploadErrorHandler;
  disabled?: boolean;
  folder?: string;
  size?: ImageUploadSize;
  /** 是否展示已上传图片和上传 tile 的外框；默认为 true。 */
  showPreviewBorder?: boolean;
  /** 提示行文本；不传时默认只展示提示图标。 */
  tip?: ReactNode;
  allowUrlInput?: boolean;
  urlPlaceholder?: string;
  /** 允许上传的图片扩展名；不传时使用 jpg、jpeg、png、gif、webp。 */
  acceptedFormats?: readonly string[];
  maxFileSizeBytes?: number;
  className?: string;
  /** 自定义已上传图片预览，也可以传入 render function。 */
  preview?: ImageUploadPreview;
  /** `preview` 的 render function 别名。 */
  renderPreview?: (url: string, index: number) => ReactNode;
  /** 自定义空状态 tile 内容，例如头像 fallback。 */
  emptyPreview?: ReactNode;
};

export type ImageUploadSingleProps = ImageUploadBaseProps & {
  value?: string | null;
  onChange: (value: string) => void;
  multiple?: false;
};

export type ImageUploadArrayProps = ImageUploadBaseProps & {
  value?: string[];
  onChange: (value: string[]) => void;
  multiple?: true;
  maxCount?: number;
};

export type ImageUploadProps = ImageUploadSingleProps | ImageUploadArrayProps;

type InternalImageUploadProps = ImageUploadBaseProps & {
  value: string[];
  onChange: (value: string[]) => void;
  multiple: boolean;
  maxCount: number;
};

type UrlInputProps = {
  draft: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function UrlInput({
  draft,
  placeholder,
  disabled,
  onChange,
  onBlur,
  onKeyDown,
}: UrlInputProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <Input
      type="url"
      size="sm"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}

type SortableImageItemProps = {
  item: ImageItem;
  index: number;
  sizeStyle: ImageSizeStyle;
  sizePixels: number;
  showPreviewBorder: boolean;
  disabled: boolean;
  uploading: boolean;
  editing: boolean;
  allowUrlInput: boolean;
  urlDraft: string;
  urlPlaceholder: string;
  preview?: ImageUploadPreview;
  renderPreview?: (url: string, index: number) => ReactNode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onChooseFile: (id: string) => void;
  onUrlChange: (value: string) => void;
  onCommitUrl: () => void;
  onCancelEdit: () => void;
  onUrlKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  deleteConfirmTitle: string;
  deleteConfirmDescription: string;
  deleteConfirmLabel: string;
  deleteCancelLabel: string;
  showDragHandle: boolean;
  editLabel: string;
  dragLabel: string;
  replaceLabel: string;
  previewAlt: string;
};

function SortableImageItem({
  item,
  index,
  sizeStyle,
  sizePixels,
  showPreviewBorder,
  disabled,
  uploading,
  editing,
  allowUrlInput,
  urlDraft,
  urlPlaceholder,
  preview,
  renderPreview,
  onEdit,
  onDelete,
  onChooseFile,
  onUrlChange,
  onCommitUrl,
  onCancelEdit,
  onUrlKeyDown,
  deleteConfirmTitle,
  deleteConfirmDescription,
  deleteConfirmLabel,
  deleteCancelLabel,
  showDragHandle,
  editLabel,
  dragLabel,
  replaceLabel,
  previewAlt,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: disabled || uploading,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
    width: sizePixels,
  };
  const handleEdit = useCallback(() => onEdit(item.id), [item.id, onEdit]);
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);
  const handleChooseFile = useCallback(
    () => onChooseFile(item.id),
    [item.id, onChooseFile],
  );
  const handleCancelEdit = useCallback(() => onCancelEdit(), [onCancelEdit]);
  const customPreview = renderPreview ?? preview;
  const previewContent =
    typeof customPreview === "function" ? (
      customPreview(item.url, index)
    ) : (
      customPreview ?? (
        <img
          src={item.url}
          alt={previewAlt}
          className="block h-auto max-h-full max-w-full w-auto object-contain"
        />
      )
    );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex w-fit flex-col gap-0.5",
        isDragging && "opacity-70",
      )}
      data-image-upload-id={item.id}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl transition-shadow",
          showPreviewBorder
            ? "border border-border/70 bg-muted/20 shadow-sm group-hover:border-primary/45 group-hover:shadow-md"
            : "border-0 bg-transparent shadow-none",
          sizeStyle.className,
        )}
        style={sizeStyle.style}
      >
        <div
          className="flex size-full min-h-0 min-w-0 items-center justify-center overflow-hidden [&_img]:max-h-full [&_img]:max-w-full"
          aria-label={previewAlt}
        >
          {previewContent}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
        <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {showDragHandle ? (
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="pointer-events-auto rounded-lg bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              {...attributes}
              {...listeners}
              aria-label={dragLabel}
            >
              <GripVertical className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className="pointer-events-auto rounded-lg bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            onClick={handleChooseFile}
            disabled={disabled || uploading}
            aria-label={replaceLabel}
          >
            <ImageUpIcon className="size-3.5" aria-hidden="true" />
          </button>
          {allowUrlInput ? (
            <button
              type="button"
              className="pointer-events-auto rounded-lg bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              onClick={handleEdit}
              disabled={disabled || uploading}
              aria-label={editLabel}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Popconfirm
            title={deleteConfirmTitle}
            description={deleteConfirmDescription}
            confirmText={deleteConfirmLabel}
            cancelText={deleteCancelLabel}
            onConfirm={handleDelete}
          >
            <button
              type="button"
              className="pointer-events-auto rounded-lg bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur hover:bg-destructive hover:text-white dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60"
              disabled={disabled || uploading}
              aria-label={deleteConfirmTitle}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </Popconfirm>
        </div>
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <Spinner />
          </div>
        ) : null}
      </div>
      {editing && allowUrlInput ? (
        <div className="flex w-full min-w-0 items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <UrlInput
              draft={urlDraft}
              placeholder={urlPlaceholder}
              disabled={disabled || uploading}
              onChange={onUrlChange}
              onBlur={onCommitUrl}
              onKeyDown={onUrlKeyDown}
            />
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            className="shrink-0"
            disabled={disabled || uploading}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleCancelEdit}
            aria-label={deleteCancelLabel}
            title={deleteCancelLabel}
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type AddImageTileProps = {
  sizeStyle: ImageSizeStyle;
  sizePixels: number;
  showPreviewBorder: boolean;
  meta: ReactNode;
  disabled: boolean;
  uploading: boolean;
  allowUrlInput: boolean;
  draft: string;
  placeholder: string;
  uploadLabel: string;
  onChooseFile: () => void;
  onDraftChange: (value: string) => void;
  onCommitUrl: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  emptyPreview?: ReactNode;
};

function AddImageTile({
  sizeStyle,
  sizePixels,
  showPreviewBorder,
  meta,
  disabled,
  uploading,
  allowUrlInput,
  draft,
  placeholder,
  uploadLabel,
  onChooseFile,
  onDraftChange,
  onCommitUrl,
  onKeyDown,
  emptyPreview,
}: AddImageTileProps) {
  const handleDraftChange = useCallback(
    (value: string) => onDraftChange(value),
    [onDraftChange],
  );
  return (
    <div className="flex w-fit flex-col gap-0.5" style={{ width: sizePixels }}>
      <button
        type="button"
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          showPreviewBorder
            ? "border border-dashed border-border/80 bg-muted/10 shadow-inner hover:border-primary/55 hover:bg-primary/5 hover:text-foreground"
            : "border-0 bg-transparent shadow-none hover:bg-transparent hover:text-foreground",
          sizeStyle.className,
        )}
        style={sizeStyle.style}
        onClick={onChooseFile}
        disabled={disabled || uploading}
        aria-label={uploadLabel}
      >
        {uploading ? <Spinner /> : emptyPreview ?? <ImagePlus className="size-6" aria-hidden="true" />}
        {meta}
      </button>
      {allowUrlInput ? (
        <div className="w-full min-w-0">
          <UrlInput
            draft={draft}
            placeholder={placeholder}
            disabled={disabled || uploading}
            onChange={handleDraftChange}
            onBlur={onCommitUrl}
            onKeyDown={onKeyDown}
          />
        </div>
      ) : null}
    </div>
  );
}

function ImageUploadField({
  value,
  onChange,
  onUpload,
  onUploadingChange,
  onUploadError,
  disabled = false,
  folder,
  size = "md",
  showPreviewBorder = true,
  tip,
  allowUrlInput = true,
  urlPlaceholder,
  acceptedFormats,
  maxFileSizeBytes = 5 * 1024 * 1024,
  className,
  preview,
  renderPreview,
  emptyPreview,
  multiple,
  maxCount,
}: InternalImageUploadProps) {
  const t = useEasyT();
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const [items, setItems] = useState<ImageItem[]>(() => reconcileImageItems([], value));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [addUrlDraft, setAddUrlDraft] = useState("");
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const sizeStyle = useMemo(() => resolveImageSize(size), [size]);
  const sizePixels = useMemo(() => resolveImageSizePixels(size), [size]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const canAdd = multiple && items.length < maxCount;
  const hasValue = items.length > 0;
  const resolvedUrlPlaceholder = urlPlaceholder ?? t("imageUpload.urlPlaceholder");
  const previewAlt = t("imageUpload.previewAlt");
  const resolvedAcceptedFormats = useMemo(
    () => normalizeAcceptedFormats(acceptedFormats),
    [acceptedFormats],
  );
  const acceptedFormatsLabel = formatAcceptedFormats(resolvedAcceptedFormats);
  const sizeLabels = {
    sm: "64 × 64 px",
    md: "96 × 96 px",
    lg: "128 × 128 px",
  } as const;
  const resolvedSizeHint = t("imageUpload.sizeHint", {
    size: typeof size === "number" ? `${size} × ${size} px` : sizeLabels[size],
  });
  const resolvedHint = tip ?? null;
  const sizeLabel = typeof size === "number" ? `${size} × ${size} px` : sizeLabels[size];
  const uploadTileMeta = (
    <UploadSizeMeta
      sizeLabel={sizeLabel}
      sizeAriaLabel={t("imageUpload.sizeTag", { size: sizeLabel })}
    />
  );
  const uploadHint = (
    <UploadHint
      hint={resolvedHint}
      hintLabel={t("imageUpload.hintLabel")}
      sizeHint={resolvedSizeHint}
      formatsHint={t("imageUpload.formatsHint", { formats: acceptedFormatsLabel })}
      sizePixels={sizePixels}
      multiple={multiple}
      count={items.length}
      maxCount={maxCount}
    />
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setItems((previous) => {
      const next = reconcileImageItems(previous, value);
      const unchanged =
        next.length === previous.length &&
        next.every(
          (item, index) =>
            item.id === previous[index]?.id && item.url === previous[index]?.url,
        );
      return unchanged ? previous : next;
    });
  }, [value]);

  useEffect(() => {
    if (editingId && !items.some((item) => item.id === editingId)) {
      setEditingId(null);
      setUrlDraft("");
    }
  }, [editingId, items]);

  const emitChange = useCallback(
    (nextItems: ImageItem[]) => {
      onChange(nextItems.map((item) => item.url));
    },
    [onChange],
  );

  const setUploadingState = useCallback(
    (next: boolean) => {
      if (!mountedRef.current) return;
      setUploading(next);
      onUploadingChange?.(next);
    },
    [onUploadingChange],
  );

  const handleChooseFile = useCallback((targetId: string | null = null) => {
    setError(null);
    setUploadTargetId(targetId);
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const targetId = uploadTargetId;
      const candidateFiles = targetId
        ? files.slice(0, 1)
        : files.slice(0, multiple ? Math.max(0, maxCount - items.length) : 1);

      if (!targetId && multiple && files.length > candidateFiles.length) {
        setError(t("imageUpload.maxCount", { count: maxCount }));
      } else {
        setError(null);
      }
      if (candidateFiles.length === 0) return;

      for (const file of candidateFiles) {
        const validationError = validateImage(
          file,
          maxFileSizeBytes,
          t("imageUpload.imageOnly"),
          t("imageUpload.unsupportedFormat", {
            formats: formatAcceptedFormats(resolvedAcceptedFormats),
          }),
          t("imageUpload.fileTooLarge"),
          resolvedAcceptedFormats,
        );
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      setUploadingState(true);
      try {
        const uploadedUrls: string[] = [];
        for (const file of candidateFiles) {
          uploadedUrls.push(await onUpload(file, folder));
        }

        if (!mountedRef.current) return;

        if (targetId) {
          const nextItems = items.map((item) =>
            item.id === targetId ? { ...item, url: uploadedUrls[0] } : item,
          );
          setItems(nextItems);
          emitChange(nextItems);
          setEditingId(null);
          setUrlDraft("");
        } else {
          const nextItems = multiple
            ? [...items, ...uploadedUrls.map((url) => createImageItem(url))]
            : [createImageItem(uploadedUrls[0])];
          setItems(nextItems);
          emitChange(nextItems);
          setAddUrlDraft("");
        }
      } catch (uploadError) {
        if (mountedRef.current) {
          setError(errorMessage(uploadError, t("imageUpload.uploadFailed")));
          onUploadError?.(uploadError);
        }
      } finally {
        if (mountedRef.current) {
          setUploadTargetId(null);
          setUploadingState(false);
        }
      }
    },
    [
      emitChange,
      folder,
      items,
      maxCount,
      maxFileSizeBytes,
      multiple,
      onUpload,
      onUploadError,
      resolvedAcceptedFormats,
      setUploadingState,
      t,
      uploadTargetId,
    ],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (files.length > 0) void handleFiles(files);
    },
    [handleFiles],
  );

  const handleEdit = useCallback(
    (id: string) => {
      const item = items.find((candidate) => candidate.id === id);
      if (!item) return;
      setError(null);
      setEditingId(id);
      setUrlDraft(item.url);
    },
    [items],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const nextItems = items.filter((item) => item.id !== id);
      setItems(nextItems);
      emitChange(nextItems);
      if (editingId === id) {
        setEditingId(null);
        setUrlDraft("");
      }
    },
    [editingId, emitChange, items],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!multiple || !event.over || event.active.id === event.over.id) return;
      const oldIndex = items.findIndex((item) => item.id === event.active.id);
      const newIndex = items.findIndex((item) => item.id === event.over?.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const nextItems = arrayMove(items, oldIndex, newIndex);
      setItems(nextItems);
      emitChange(nextItems);
    },
    [emitChange, items, multiple],
  );

  const commitAddUrl = useCallback(() => {
    const nextUrl = addUrlDraft.trim();
    if (!nextUrl) return;
    if (!isValidImageUrl(nextUrl)) {
      setError(t("imageUpload.invalidUrl"));
      return;
    }
    if (multiple && items.length >= maxCount) {
      setError(t("imageUpload.maxCount", { count: maxCount }));
      return;
    }
    const nextItems = multiple
      ? [...items, createImageItem(nextUrl)]
      : [createImageItem(nextUrl)];
    setItems(nextItems);
    emitChange(nextItems);
    setAddUrlDraft("");
    setError(null);
  }, [addUrlDraft, emitChange, items, maxCount, multiple, t]);

  const commitEditUrl = useCallback(() => {
    if (!editingId) return;
    const nextUrl = urlDraft.trim();
    if (!isValidImageUrl(nextUrl)) {
      setError(t("imageUpload.invalidUrl"));
      return;
    }
    const nextItems = items.map((item) =>
      item.id === editingId ? { ...item, url: nextUrl } : item,
    );
    setItems(nextItems);
    emitChange(nextItems);
    setEditingId(null);
    setUrlDraft("");
    setError(null);
  }, [editingId, emitChange, items, t, urlDraft]);

  const handleUrlKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commitEditUrl();
    },
    [commitEditUrl],
  );

  const handleAddUrlKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commitAddUrl();
    },
    [commitAddUrl],
  );

  const handleUrlChange = useCallback((value: string) => setUrlDraft(value), []);
  const handleAddUrlChange = useCallback(
    (value: string) => setAddUrlDraft(value),
    [],
  );
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setUrlDraft("");
    setError(null);
  }, []);

  const isBusy = disabled || uploading;

  return (
    <div className={cn("flex flex-col gap-3", !multiple && "w-fit", className)}>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={resolvedAcceptedFormats.map((format) => `.${format}`).join(",")}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={isBusy}
        aria-label={t("imageUpload.uploadImage")}
      />
      <div className="flex flex-col gap-0.5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap items-start gap-4">
            {items.map((item, index) => (
              <SortableImageItem
                key={item.id}
                item={item}
                index={index}
                sizeStyle={sizeStyle}
                sizePixels={sizePixels}
                showPreviewBorder={showPreviewBorder}
                disabled={disabled}
                uploading={uploading}
                editing={editingId === item.id}
                allowUrlInput={allowUrlInput}
                urlDraft={urlDraft}
                urlPlaceholder={resolvedUrlPlaceholder}
                preview={preview}
                renderPreview={renderPreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onChooseFile={handleChooseFile}
                onUrlChange={handleUrlChange}
                onCommitUrl={commitEditUrl}
                onCancelEdit={handleCancelEdit}
                onUrlKeyDown={handleUrlKeyDown}
                deleteConfirmTitle={t("imageUpload.deleteTitle")}
                deleteConfirmDescription={t("imageUpload.deleteDescription")}
                deleteConfirmLabel={t("actions.confirm")}
                deleteCancelLabel={t("actions.cancel")}
                showDragHandle={multiple}
                editLabel={t("imageUpload.edit")}
                dragLabel={t("imageUpload.dragImage")}
                replaceLabel={t("imageUpload.replaceImage")}
                previewAlt={previewAlt}
              />
            ))}
            {!hasValue || canAdd ? (
              <AddImageTile
                sizeStyle={sizeStyle}
                sizePixels={sizePixels}
                showPreviewBorder={showPreviewBorder}
                meta={uploadTileMeta}
                disabled={disabled}
                uploading={uploading}
                allowUrlInput={allowUrlInput}
                draft={addUrlDraft}
                placeholder={resolvedUrlPlaceholder}
                uploadLabel={t("imageUpload.uploadImage")}
                emptyPreview={emptyPreview}
                onChooseFile={handleChooseFile}
                onDraftChange={handleAddUrlChange}
                onCommitUrl={commitAddUrl}
                onKeyDown={handleAddUrlKeyDown}
              />
            ) : null}
          </div>
        </SortableContext>
        </DndContext>
        {uploadHint}
      </div>
      {error ? (
        <div className="text-xs text-destructive" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export function ImageUpload(props: ImageUploadSingleProps): ReactElement;
export function ImageUpload(props: ImageUploadArrayProps): ReactElement;
export function ImageUpload(props: ImageUploadProps): ReactElement {
  const isMultiple = props.multiple === true || Array.isArray(props.value);

  if (isMultiple) {
    const value = Array.isArray(props.value)
      ? props.value
      : props.value
        ? [props.value]
        : [];
    return (
      <ImageUploadField
        {...props}
        value={value}
        onChange={props.onChange as (value: string[]) => void}
        multiple
        maxCount={
          "maxCount" in props && props.maxCount !== undefined ? props.maxCount : 9
        }
      />
    );
  }

  const value =
    typeof props.value === "string" && props.value.trim() ? [props.value] : [];
  return (
    <ImageUploadField
      {...props}
      value={value}
      onChange={(nextValue) =>
        (props.onChange as (value: string) => void)(nextValue[0] ?? "")
      }
      multiple={false}
      maxCount={1}
    />
  );
}

export type ImageUploadMultipleProps = ImageUploadArrayProps;

export function ImageUploadMultiple(props: ImageUploadMultipleProps) {
  return <ImageUpload {...props} multiple />;
}
