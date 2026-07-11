import { useState, type CSSProperties } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEasyT } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SearchFieldDef, SearchMode } from './types'

export const EASY_SEARCH_FORM_COLLAPSED_FIELDS = 3

export type EasySearchFormActionsProps = {
  onSearch: () => void
  onReset: () => void
  canCollapse?: boolean
  collapsed?: boolean
  onToggle?: () => void
  className?: string
  style?: CSSProperties
}

export type EasySearchFormProps = {
  fields: SearchFieldDef[]
  onSearch: (values: Record<string, unknown>) => void
  onReset: () => void
  onValuesChange?: (values: Record<string, unknown>) => void
  searchMode?: SearchMode
  values?: Record<string, unknown>
  collapsed?: boolean
  onToggle?: () => void
  actionsClassName?: string
  hideActionsOnMobile?: boolean
}

export function EasySearchFormActions({
  onSearch,
  onReset,
  canCollapse = false,
  collapsed = true,
  onToggle,
  className,
  style,
}: EasySearchFormActionsProps) {
  const t = useEasyT()

  return (
    <div
      className={cn('flex shrink-0 flex-wrap items-center justify-end gap-2', className)}
      style={style}
    >
      <Button variant="outline" size="sm" onClick={onReset}>
        {t('actions.reset')}
      </Button>
      <Button size="sm" onClick={onSearch}>
        {t('actions.search')}
      </Button>
      {canCollapse && (
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {collapsed ? t('actions.expand') : t('actions.collapse')}
          <ChevronDown
            className={cn(
              'ml-1 size-4 transition-transform',
              !collapsed && 'rotate-180',
            )}
          />
        </Button>
      )}
    </div>
  )
}

export function EasySearchForm({
  fields,
  onSearch,
  onReset,
  onValuesChange,
  searchMode = 'auto',
  values: controlledValues,
  collapsed: controlledCollapsed,
  onToggle,
  actionsClassName,
  hideActionsOnMobile = false,
}: EasySearchFormProps) {
  const t = useEasyT()
  const [internalCollapsed, setInternalCollapsed] = useState(true)
  const [internalValues, setInternalValues] = useState<Record<string, unknown>>({})

  const values = controlledValues ?? internalValues
  const collapsed = controlledCollapsed ?? internalCollapsed
  const toggle = onToggle ?? (() => setInternalCollapsed((v) => !v))

  const visibleFields = collapsed ? fields.slice(0, EASY_SEARCH_FORM_COLLAPSED_FIELDS) : fields
  const canCollapse = fields.length > EASY_SEARCH_FORM_COLLAPSED_FIELDS

  function updateValues(next: Record<string, unknown>) {
    if (!controlledValues) {
      setInternalValues(next)
    }
    onValuesChange?.(next)
  }

  function handleChange(field: SearchFieldDef, value: unknown) {
    const next = { ...values, [field.key]: value }

    updateValues(next)

    if (searchMode === 'auto' && field.type !== 'input') {
      onSearch(next)
    }
  }

  function handleSearch() {
    onSearch(values)
  }

  function handleInputClear(field: SearchFieldDef) {
    const next = { ...values, [field.key]: '' }

    updateValues(next)

    if (searchMode === 'auto') {
      onSearch(next)
    }
  }

  function handleInputBlur() {
    if (searchMode === 'auto') {
      handleSearch()
    }
  }

  function handleReset() {
    updateValues({})
    onReset()
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {visibleFields.map((field) => (
        <div
          key={field.key}
          className="flex min-w-0 items-center gap-2"
          style={field.colSpan ? { gridColumn: `span ${field.colSpan}` } : undefined}
        >
          <label className="shrink-0 text-sm font-medium text-foreground">
            {t(field.labelKey)}
          </label>
          {field.type === 'input' ? (
            <div className="relative min-w-0 flex-1">
              <Input
                placeholder={field.placeholder}
                value={(values[field.key] as string) ?? ''}
                className="[&_[data-slot=input]]:pr-8"
                onChange={(e) => handleChange(field, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onBlur={handleInputBlur}
              />
              {Boolean(values[field.key]) && (
                <button
                  type="button"
                  aria-label={t('actions.clear')}
                  className="absolute right-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground/72 outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:size-5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInputClear(field)}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ) : field.type === 'dateRange' ? (
            <div className="min-w-0 flex-1">
              <DateRangePicker
                value={values[field.key] as DateRangeValue | undefined}
                onChange={(v) => handleChange(field, v)}
                placeholder={field.placeholder}
                showTime={field.showTime}
                className="min-w-0 max-w-full overflow-hidden w-full [&>span]:min-w-0 [&>span]:truncate"
              />
            </div>
          ) : field.type === 'custom' ? (
            <div className="min-w-0 flex-1">
              {field.render(values[field.key], (v) => handleChange(field, v))}
            </div>
          ) : (
            <Select
              value={(values[field.key] as string) ?? ''}
              onValueChange={(v) => v !== null && handleChange(field, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('searchTable.all')}</SelectItem>
                {field.options?.filter((opt) => opt.value !== '').map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <EasySearchFormActions
        onSearch={handleSearch}
        onReset={handleReset}
        canCollapse={canCollapse}
        collapsed={collapsed}
        onToggle={toggle}
        className={cn(actionsClassName, hideActionsOnMobile && 'hidden md:flex')}
        style={{ gridColumnEnd: -1 }}
      />
    </div>
  )
}
