import { useEffect, useId, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react'
import { ChevronDown, RotateCcwIcon, SearchIcon, X } from 'lucide-react'
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
import type { SearchFieldDef, SearchFormValues, SearchMode } from './types'
import { EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD, getSearchFieldColumnSpan, getSearchFieldDefaultValues } from './utils'

export type EasySearchFormActionsProps = {
  onSearch: () => void
  onReset: () => void
  canCollapse?: boolean
  collapsed?: boolean
  onToggle?: () => void
  className?: string
  style?: CSSProperties
  ownerId?: string
}

export type EasySearchFormFooterContext = { actions: ReactNode }

export type EasySearchFormProps = {
  fields: SearchFieldDef[]
  onSearch: (values: SearchFormValues) => void
  onReset?: (values: SearchFormValues) => void
  onValuesChange?: (values: SearchFormValues) => void
  searchMode?: SearchMode
  values?: SearchFormValues
  defaultValues?: SearchFormValues
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onToggle?: () => void
  className?: string
  actionsClassName?: string
  hideActionsOnMobile?: boolean
  collapseThreshold?: number
  showActions?: boolean
  renderFooter?: (context: EasySearchFormFooterContext) => ReactNode
}

export function EasySearchFormActions({
  onSearch,
  onReset,
  canCollapse = false,
  collapsed = true,
  onToggle,
  className,
  style,
  ownerId,
}: EasySearchFormActionsProps) {
  const t = useEasyT()

  return (
    <div
      className={cn('flex shrink-0 flex-wrap items-center justify-end gap-2', className)}
      data-slot="easy-search-form-actions"
      style={style}
    >
      <Button size="sm" data-search-form-owner={ownerId} data-search-form-action="search" onClick={onSearch}>
        <SearchIcon className="size-4" />
        {t('actions.search')}
      </Button>
      <Button variant="outline" size="sm" data-search-form-owner={ownerId} data-search-form-action="reset" onClick={onReset}>
        <RotateCcwIcon className="size-4" />
        {t('actions.reset')}
      </Button>
      {canCollapse && (
        <Button variant="ghost" size="sm" aria-expanded={!collapsed} onClick={onToggle}>
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
  defaultValues,
  collapsed: controlledCollapsed,
  defaultCollapsed = true,
  onCollapsedChange,
  onToggle,
  className,
  actionsClassName,
  hideActionsOnMobile = false,
  collapseThreshold = EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD,
  showActions = true,
  renderFooter,
}: EasySearchFormProps) {
  const t = useEasyT()
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(1)
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const [internalValues, setInternalValues] = useState<SearchFormValues>(
    () => getSearchFieldDefaultValues(fields, defaultValues),
  )

  const values = controlledValues ?? internalValues
  const collapsed = controlledCollapsed ?? internalCollapsed

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // These widths match the form's named CSS container queries below.
    const updateColumns = (width: number) => setColumnCount(width >= 1024 ? 3 : width >= 640 ? 2 : 1)
    const measure = () => {
      const style = getComputedStyle(container)
      updateColumns(container.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0'))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateColumns(entry.contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const normalizedCollapseThreshold = Math.max(1, collapseThreshold)
  const visibleFields = collapsed
    ? fields.slice(0, normalizedCollapseThreshold)
    : fields
  const canCollapse = fields.length > normalizedCollapseThreshold
  const filledColumns = visibleFields.reduce((filled, field) => {
    const span = getSearchFieldColumnSpan(field, columnCount)
    return ((filled + span > columnCount ? 0 : filled) + span) % columnCount
  }, 0)
  const actionsInFooter = visibleFields.length > 0 && filledColumns === 0

  function toggle() {
    const nextCollapsed = !collapsed
    // Legacy onToggle remains responsible for toggling its own state.
    if (controlledCollapsed === undefined && !onToggle) setInternalCollapsed(nextCollapsed)
    onCollapsedChange?.(nextCollapsed)
    onToggle?.()
  }

  function updateValues(next: SearchFormValues) {
    if (controlledValues === undefined) {
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

  function handleInputBlur(event: FocusEvent<HTMLInputElement>) {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof HTMLElement && nextTarget.dataset.searchFormOwner === id && nextTarget.dataset.searchFormAction) return
    if (searchMode === 'auto') {
      handleSearch()
    }
  }

  function handleReset() {
    const defaults = getSearchFieldDefaultValues(fields, defaultValues)
    updateValues(defaults)
    if (onReset) onReset(defaults)
    else onSearch(defaults)
  }

  const actions = showActions && fields.length > 0 ? (
    <EasySearchFormActions
      ownerId={id}
      onSearch={handleSearch}
      onReset={handleReset}
      canCollapse={canCollapse}
      collapsed={collapsed}
      onToggle={toggle}
      className={cn(!actionsInFooter && filledColumns + 1 !== columnCount && 'justify-start', actionsClassName, hideActionsOnMobile && 'hidden @[640px]/easy-search-form:flex')}
    />
  ) : null

  return (
    <div ref={containerRef} className={cn('@container/easy-search-form min-w-0 space-y-4', className)} data-slot="easy-search-form-root">
      {fields.length > 0 && <div
        className="grid grid-cols-1 items-end gap-3 @[640px]/easy-search-form:grid-cols-2 @[1024px]/easy-search-form:grid-cols-3"
        data-slot="easy-search-form"
      >
        {visibleFields.map((field) => (
          <div
            key={field.key}
            className="col-span-1 flex min-w-0 flex-col items-stretch gap-1.5 @[640px]/easy-search-form:col-span-[var(--easy-search-span-two)] @[768px]/easy-search-form:flex-row @[768px]/easy-search-form:items-center @[768px]/easy-search-form:gap-2 @[1024px]/easy-search-form:col-span-[var(--easy-search-span-three)]"
            style={{
              '--easy-search-span-two': getSearchFieldColumnSpan(field, 2),
              '--easy-search-span-three': getSearchFieldColumnSpan(field, 3),
            } as CSSProperties}
          >
            <label id={`${id}-${field.key}-label`} htmlFor={field.type === 'input' || field.type === 'select' ? `${id}-${field.key}` : undefined} className="shrink-0 break-words text-sm font-medium text-foreground @[768px]/easy-search-form:max-w-28">
              {t(field.labelKey)}
            </label>
            {field.type === 'input' ? (
              <div className="relative min-w-0 flex-1">
                <Input
                  id={`${id}-${field.key}`}
                  aria-label={t(field.labelKey)}
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
              <div className="min-w-0 flex-1" role="group" aria-labelledby={`${id}-${field.key}-label`}>
                <DateRangePicker
                  value={values[field.key] as DateRangeValue | undefined}
                  onChange={(v) => handleChange(field, v)}
                  placeholder={field.placeholder}
                  showTime={field.showTime}
                  className="min-w-0 max-w-full overflow-hidden w-full [&>span]:min-w-0 [&>span]:truncate"
                />
              </div>
            ) : field.type === 'custom' ? (
              <div className="min-w-0 flex-1" role="group" aria-labelledby={`${id}-${field.key}-label`}>
                {field.render(
                  Object.prototype.hasOwnProperty.call(values, field.key) ? values[field.key] ?? null : field.defaultValue ?? null,
                  (v) => handleChange(field, v),
                )}
              </div>
            ) : (
              <Select
                value={(values[field.key] as string) ?? ''}
                onValueChange={(v) => handleChange(field, v ?? '')}
              >
                <SelectTrigger id={`${id}-${field.key}`} className="min-w-0 w-full @[768px]/easy-search-form:flex-1" aria-label={t(field.labelKey)}>
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

        {!actionsInFooter && actions}
      </div>}
      {renderFooter ? renderFooter({ actions: actionsInFooter ? actions : null }) : actionsInFooter && actions}
    </div>
  )
}
