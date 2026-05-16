import { useId } from 'react'
import { GripVertical, Settings2 } from 'lucide-react'
import { useEasyT } from '@/i18n'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip'
import type { ColumnDef } from './types'

type EasyColumnConfigProps<T> = {
  columns: ColumnDef<T>[]
  visibleKeys: string[]
  onChange: (keys: string[]) => void
  onOrderChange: (keys: string[]) => void
  onReset: () => void
}

type SortableItemProps = {
  id: string
  label: string
  configId: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function SortableItem({
  id,
  label,
  configId,
  checked,
  onCheckedChange,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--accent)]"
    >
      <span
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex size-5 shrink-0 cursor-grab items-center justify-center text-[var(--muted-foreground)] active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </span>
      <Checkbox
        id={`${configId}-${id}`}
        className="cursor-pointer"
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <label
        htmlFor={`${configId}-${id}`}
        className="min-w-0 flex-1 cursor-pointer truncate"
      >
        {label}
      </label>
    </div>
  )
}

export function EasyColumnConfig<T>({
  columns,
  visibleKeys,
  onChange,
  onOrderChange,
  onReset,
}: EasyColumnConfigProps<T>) {
  const t = useEasyT()
  const configId = useId()

  const allKeys = columns.map((c) => c.key)
  const allSelected = allKeys.every((k) => visibleKeys.includes(k))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = allKeys.indexOf(String(active.id))
    const newIndex = allKeys.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onOrderChange(arrayMove(allKeys, oldIndex, newIndex))
  }

  function handleToggle(key: string, checked: boolean) {
    if (checked) {
      onChange([...visibleKeys, key])
    } else {
      onChange(visibleKeys.filter((k) => k !== key))
    }
  }

  return (
    <Tooltip>
      <Popover>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="size-8">
              <Settings2 className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipPopup>{t('searchTable.columnConfig')}</TooltipPopup>
        <PopoverContent align="end" className="w-64">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(allKeys)}
              disabled={allSelected}
            >
              {t('actions.selectAll')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset}>
              {t('actions.reset')}
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allKeys}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {columns.map((col) => (
                  <SortableItem
                    key={col.key}
                    id={col.key}
                    label={t(col.headerKey)}
                    configId={configId}
                    checked={visibleKeys.includes(col.key)}
                    onCheckedChange={(checked) =>
                      handleToggle(col.key, checked)
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </PopoverContent>
    </Popover>
    </Tooltip>
  )
}
