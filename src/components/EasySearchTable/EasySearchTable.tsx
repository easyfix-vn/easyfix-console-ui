import { useEffect, useState, useMemo, useRef, type CSSProperties } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Ghost, LayoutGrid, List, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEasyT } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SegmentedControl,
  SegmentedControlList,
  SegmentedControlItem,
} from '@/components/ui/segmented-control'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  EasySearchForm,
  EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD,
  getSearchFieldDefaultValues,
} from '../EasySearchForm'
import { EasyColumnConfig } from './EasyColumnConfig'
import type { ColumnDef, SearchFieldDef, SearchMode, SearchParams, SearchTableView, SortState } from './types'

export type { ColumnDef, SearchFieldDef, SearchMode, SearchParams, SearchTableView, SortState, SortOrder, PageResult } from './types'

export type EasySearchTableExportContext<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  visibleKeys: string[]
  searchValues: Record<string, unknown>
  exportParams: Record<string, unknown>
  close: () => void
  exportCurrentData: () => void
}

export type EasySearchTableEmptyContext = {
  view: SearchTableView
  searchValues: Record<string, unknown>
  reset: () => void
}

export type EasySearchTableProps<T> = {
  columns: ColumnDef<T>[]
  searchFields: SearchFieldDef[]
  searchMode?: SearchMode
  data: T[]
  total: number
  page: number
  pageSize: number
  onSearch: (params: SearchParams) => void
  loading?: boolean
  defaultView?: SearchTableView
  views?: SearchTableView[]
  skeletonRows?: number
  toolbarActions?: ReactNode
  showExport?: boolean
  exportFileName?: string
  renderExportContent?: (context: EasySearchTableExportContext<T>) => ReactNode
  renderEmptyContent?: (context: EasySearchTableEmptyContext) => ReactNode
  renderCard?: (record: T, columns: ColumnDef<T>[]) => ReactNode
  renderListItem?: (record: T, columns: ColumnDef<T>[]) => ReactNode
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showPageJumper?: boolean
  defaultSort?: SortState
  onSort?: (sort: SortState) => void
  searchCollapseThreshold?: number
  searchThrottleMs?: number
}

const viewIcons: Record<SearchTableView, typeof Table2> = {
  table: Table2,
  card: LayoutGrid,
  list: List,
}

function getColumnOrder<T>(columns: ColumnDef<T>[]) {
  return columns.filter((column) => !column.hidden).map((column) => column.key)
}

function getDefaultVisibleKeys<T>(columns: ColumnDef<T>[]) {
  return columns
    .filter((column) => !column.hidden && column.defaultVisible !== false)
    .map((column) => column.key)
}

function areSearchValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime()
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length &&
      left.every((value, index) => areSearchValuesEqual(value, right[index]))
  }

  if (
    left !== null &&
    right !== null &&
    typeof left === 'object' &&
    typeof right === 'object'
  ) {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftKeys = Object.keys(leftRecord).filter(
      (key) => leftRecord[key] !== undefined,
    )
    const rightKeys = Object.keys(rightRecord).filter(
      (key) => rightRecord[key] !== undefined,
    )

    return leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(rightRecord, key) &&
          areSearchValuesEqual(leftRecord[key], rightRecord[key]),
      )
  }

  return false
}

export function EasySearchTable<T extends Record<string, unknown>>({
  columns,
  searchFields,
  searchMode = 'auto',
  data,
  total,
  page,
  pageSize,
  onSearch,
  loading,
  defaultView = 'table',
  views: viewsProp,
  skeletonRows = 5,
  toolbarActions,
  showExport = true,
  exportFileName = 'table-data.csv',
  renderExportContent,
  renderEmptyContent,
  renderCard,
  renderListItem,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  showPageJumper = true,
  defaultSort,
  onSort,
  searchCollapseThreshold = EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD,
  searchThrottleMs = 300,
}: EasySearchTableProps<T>) {
  const t = useEasyT()
  const [columnOrder, setColumnOrder] = useState(() => getColumnOrder(columns))
  const [visibleKeys, setVisibleKeys] = useState(() => getDefaultVisibleKeys(columns))
  const availableViews = useMemo(() => {
    if (viewsProp) return viewsProp
    const views: SearchTableView[] = ['table']
    if (renderCard) views.push('card')
    if (renderListItem) views.push('list')
    return views
  }, [viewsProp, renderCard, renderListItem])

  const [view, setView] = useState<SearchTableView>(() =>
    availableViews.includes(defaultView) ? defaultView : availableViews[0],
  )
  const defaultSearchValues = useMemo(
    () => getSearchFieldDefaultValues(searchFields),
    [searchFields],
  )
  const [searchValues, setSearchValues] = useState<Record<string, unknown>>(
    () => getSearchFieldDefaultValues(searchFields),
  )
  const [exportOpen, setExportOpen] = useState(false)
  const [sortState, setSortState] = useState<SortState | null>(defaultSort ?? null)
  const [jumpPage, setJumpPage] = useState('')
  const [internalPageSize, setInternalPageSize] = useState(pageSize)
  const lastSubmittedSearchValuesRef = useRef<Record<string, unknown>>(
    getSearchFieldDefaultValues(searchFields),
  )
  const pendingSearchValuesRef = useRef<Record<string, unknown> | null>(null)
  const searchThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSearchRunAtRef = useRef(0)
  useEffect(() => {
    const availableKeys = getColumnOrder(columns)
    const defaultVisibleKeys = getDefaultVisibleKeys(columns)
    setColumnOrder((currentOrder) => [
      ...currentOrder.filter((key) => availableKeys.includes(key)),
      ...availableKeys.filter((key) => !currentOrder.includes(key)),
    ])
    setVisibleKeys((currentKeys) =>
      [
        ...currentKeys.filter((key) => availableKeys.includes(key)),
        ...defaultVisibleKeys.filter((key) => !currentKeys.includes(key)),
      ],
    )
  }, [columns])

  useEffect(
    () => () => {
      if (searchThrottleTimerRef.current) {
        clearTimeout(searchThrottleTimerRef.current)
      }
    },
    [],
  )

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((column) => [column.key, column]))
    return columnOrder
      .map((key) => columnMap.get(key))
      .filter((column): column is ColumnDef<T> => {
        return Boolean(column) && column?.hidden !== true
      })
  }, [columns, columnOrder])

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => visibleKeys.includes(c.key)),
    [orderedColumns, visibleKeys],
  )
  const exportColumns = useMemo(
    () => visibleColumns.filter((c) => c.exportable !== false),
    [visibleColumns],
  )

  const stickyStyles = useMemo(() => {
    const styles = new Map<string, CSSProperties>()
    let leftOffset = 0
    for (const col of visibleColumns) {
      if (col.fixed === 'left') {
        styles.set(col.key, { position: 'sticky', left: leftOffset, zIndex: 2 })
        leftOffset += (typeof col.width === 'number' ? col.width : 120)
      }
    }
    let rightOffset = 0
    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      const col = visibleColumns[i]
      if (col.fixed === 'right') {
        styles.set(col.key, { position: 'sticky', right: rightOffset, zIndex: 2 })
        rightOffset += (typeof col.width === 'number' ? col.width : 120)
      }
    }
    return styles
  }, [visibleColumns])

  const totalPages = Math.max(1, Math.ceil(total / internalPageSize))
  const exportParams = useMemo(() => ({ ...searchValues }), [searchValues])

  function submitSearch(values: Record<string, unknown>) {
    if (areSearchValuesEqual(lastSubmittedSearchValuesRef.current, values)) {
      return
    }

    lastSubmittedSearchValuesRef.current = { ...values }
    lastSearchRunAtRef.current = Date.now()
    onSearch({ page: 1, pageSize: internalPageSize, ...values })
  }

  function scheduleSearch(values: Record<string, unknown>) {
    const nextValues = { ...values }
    const throttleMs = Math.max(0, searchThrottleMs)

    pendingSearchValuesRef.current = nextValues

    if (throttleMs === 0) {
      if (searchThrottleTimerRef.current) {
        clearTimeout(searchThrottleTimerRef.current)
        searchThrottleTimerRef.current = null
      }
      pendingSearchValuesRef.current = null
      submitSearch(nextValues)
      return
    }

    const elapsed = Date.now() - lastSearchRunAtRef.current
    if (!searchThrottleTimerRef.current && elapsed >= throttleMs) {
      pendingSearchValuesRef.current = null
      submitSearch(nextValues)
      return
    }

    if (searchThrottleTimerRef.current) return

    searchThrottleTimerRef.current = setTimeout(() => {
      searchThrottleTimerRef.current = null
      const pendingValues = pendingSearchValuesRef.current
      pendingSearchValuesRef.current = null

      if (pendingValues) {
        submitSearch(pendingValues)
      }
    }, Math.max(0, throttleMs - elapsed))
  }

  function handleSearch(values: Record<string, unknown>) {
    setSearchValues(values)
    scheduleSearch(values)
  }

  function handleReset(values = defaultSearchValues) {
    setSearchValues(values)
    scheduleSearch(values)
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return
    onSearch({ ...lastSubmittedSearchValuesRef.current, page: newPage, pageSize: internalPageSize })
  }

  function handlePageSizeChange(newSize: number) {
    // A throttled search was already requested. Carry it into the new page
    // size, while leaving any newer, unsubmitted manual edits as drafts.
    const submittedValues = pendingSearchValuesRef.current ?? lastSubmittedSearchValuesRef.current
    if (searchThrottleTimerRef.current) {
      clearTimeout(searchThrottleTimerRef.current)
      searchThrottleTimerRef.current = null
    }
    pendingSearchValuesRef.current = null
    lastSubmittedSearchValuesRef.current = { ...submittedValues }
    setInternalPageSize(newSize)
    onSearch({ ...submittedValues, page: 1, pageSize: newSize })
  }

  function handleJumpPage() {
    const n = parseInt(jumpPage, 10)
    if (!isNaN(n)) {
      handlePageChange(Math.min(Math.max(1, n), totalPages))
    }
    setJumpPage('')
  }

  function handleSort(key: string) {
    const next: SortState = sortState?.key === key
      ? { key, order: sortState.order === 'asc' ? 'desc' : sortState.order === 'desc' ? null : 'asc' }
      : { key, order: 'asc' }
    setSortState(next)
    if (onSort) onSort(next)
  }

  const sortedData = useMemo(() => {
    if (!sortState || sortState.order === null) return data
    return [...data].sort((a, b) => {
      const av = a[sortState.key]
      const bv = b[sortState.key]
      const cmp = av == null ? -1 : bv == null ? 1 : av < bv ? -1 : av > bv ? 1 : 0
      return sortState.order === 'asc' ? cmp : -cmp
    })
  }, [data, sortState])

  function renderCell(record: T, col: ColumnDef<T>) {
    if (col.render) return col.render(record[col.key], record)
    const value = record[col.key]
    return value == null ? '—' : String(value)
  }

  function getExportValue(record: T, col: ColumnDef<T>) {
    if (col.exportValue) return col.exportValue(record[col.key], record)
    const value = record[col.key]
    return value == null ? '' : String(value)
  }

  function escapeCsvCell(value: string | number | null | undefined) {
    const text = value == null ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  function exportCurrentData() {
    const headers = exportColumns.map((col) => t(col.headerKey))
    const rows = data.map((record) =>
      exportColumns.map((col) => escapeCsvCell(getExportValue(record, col))).join(','),
    )
    const csv = [headers.map(escapeCsvCell).join(','), ...rows].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = exportFileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportContext: EasySearchTableExportContext<T> = {
    data,
    columns: exportColumns,
    visibleKeys,
    searchValues,
    exportParams,
    close: () => setExportOpen(false),
    exportCurrentData,
  }

  function renderExportButton() {
    const button = (
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={t('actions.export')}
        onClick={renderExportContent ? undefined : exportCurrentData}
      >
        <Download className="size-4" />
      </Button>
    )

    const trigger = (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          {renderExportContent ? (
            <Popover open={exportOpen} onOpenChange={setExportOpen}>
              <PopoverTrigger asChild>{button}</PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                {renderExportContent(exportContext)}
              </PopoverContent>
            </Popover>
          ) : button}
        </TooltipTrigger>
        <TooltipPopup>{t('actions.export')}</TooltipPopup>
      </Tooltip>
    )

    return trigger
  }

  function renderDefaultCard(record: T) {
    const [titleColumn, ...detailColumns] = visibleColumns
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
        {titleColumn && (
          <div className="mb-3 truncate border-b border-[var(--border)] pb-3 text-base font-semibold text-[var(--card-foreground)]">
            {renderCell(record, titleColumn)}
          </div>
        )}
        <div className="space-y-2.5">
          {detailColumns.map((col) => (
            <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
              <span className="shrink-0 text-[var(--muted-foreground)]">{t(col.headerKey)}</span>
              <span className="min-w-0 truncate text-right text-[var(--card-foreground)]">{renderCell(record, col)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderDefaultListItem(record: T) {
    const [titleColumn, ...detailColumns] = visibleColumns
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors duration-200 hover:bg-[var(--accent)]/50">
        <div className="grid gap-3 md:grid-cols-[minmax(180px,1.2fr)_minmax(0,2fr)] md:items-center">
          <div className="min-w-0 truncate text-base font-semibold text-[var(--card-foreground)]">
            {titleColumn ? renderCell(record, titleColumn) : '—'}
          </div>
          <div className="grid min-w-0 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {detailColumns.map((col) => (
              <div key={col.key} className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{t(col.headerKey)}</span>
                <span className="min-w-0 truncate text-[var(--card-foreground)]">{renderCell(record, col)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderSkeletonContent() {
    const rows = Array.from({ length: skeletonRows })

    if (view === 'card') {
      return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((_, index) => (
            <div key={index} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
              <Skeleton className="mb-4 h-5 w-2/3" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (view === 'list') {
      return (
        <div className="space-y-3">
          {rows.map((_, index) => (
            <div key={index} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[minmax(180px,1.2fr)_minmax(0,2fr)] md:items-center">
                <Skeleton className="h-5 w-40" />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key} className="whitespace-nowrap">
                  {t(col.headerKey)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {visibleColumns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  function renderSortIcon(key: string) {
    if (!sortState || sortState.key !== key) return <ArrowUpDown className="ml-1 inline size-3.5 opacity-40" />
    if (sortState.order === 'asc') return <ArrowUp className="ml-1 inline size-3.5" />
    if (sortState.order === 'desc') return <ArrowDown className="ml-1 inline size-3.5" />
    return <ArrowUpDown className="ml-1 inline size-3.5 opacity-40" />
  }

  function renderEmptyState() {
    return (
      <div className="min-w-0" data-slot="easy-search-table-empty">
        {renderEmptyContent ? (
          renderEmptyContent({ view, searchValues, reset: () => handleReset() })
        ) : (
          <Empty className="min-h-48 py-10 md:py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Ghost />
              </EmptyMedia>
              <EmptyTitle className="text-base">
                {t('searchTable.empty')}
              </EmptyTitle>
              <EmptyDescription>
                {t('searchTable.emptyDescription')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    )
  }

  function renderContent() {
    if (loading) return renderSkeletonContent()

    if (view === 'card') {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedData.length === 0 ? (
            <div className="col-span-full">
              {renderEmptyState()}
            </div>
          ) : (
            sortedData.map((record, idx) => (
              <div key={(record['id'] as string) ?? idx}>
                {renderCard ? renderCard(record, visibleColumns) : renderDefaultCard(record)}
              </div>
            ))
          )}
        </div>
      )
    }

    if (view === 'list') {
      return (
        <div className="space-y-2">
          {sortedData.length === 0 ? (
            renderEmptyState()
          ) : (
            sortedData.map((record, idx) => (
              <div key={(record['id'] as string) ?? idx}>
                {renderListItem ? renderListItem(record, visibleColumns) : renderDefaultListItem(record)}
              </div>
            ))
          )}
        </div>
      )
    }

    return (
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => {
                const sticky = stickyStyles.get(col.key)
                return (
                  <TableHead
                    key={col.key}
                    className={cn('whitespace-nowrap', sticky && 'bg-[var(--card)]', col.sortable && 'cursor-pointer select-none')}
                    style={{ ...sticky, ...(col.width ? { width: col.width } : undefined) }}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    {t(col.headerKey)}
                    {col.sortable && renderSortIcon(col.key)}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(visibleColumns.length, 1)}
                  className="p-0"
                >
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((record, idx) => (
                <TableRow key={(record['id'] as string) ?? idx}>
                  {visibleColumns.map((col) => {
                    const sticky = stickyStyles.get(col.key)
                    return (
                      <TableCell
                        key={col.key}
                        className={cn('whitespace-nowrap', sticky && 'bg-[var(--card)]')}
                        style={sticky}
                      >
                        <div className="truncate" title={String(record[col.key] ?? '')}>
                          {renderCell(record, col)}
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-4" data-slot="easy-search-table">
      <EasySearchForm
        fields={searchFields}
        searchMode={searchMode}
        values={searchValues}
        onSearch={handleSearch}
        onReset={handleReset}
        onValuesChange={setSearchValues}
        collapseThreshold={searchCollapseThreshold}
        renderFooter={({ actions }) => (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {toolbarActions}
              {actions}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {availableViews.length > 1 && (
                <SegmentedControl
                  value={view}
                  onValueChange={(v) => setView(v as SearchTableView)}
                >
                  <SegmentedControlList className="h-8">
                    {availableViews.map((item) => {
                      const Icon = viewIcons[item]
                      return (
                        <Tooltip key={item}>
                          <TooltipTrigger render={<span className="inline-flex" />}>
                            <SegmentedControlItem value={item}>
                              <Icon className="size-3.5" />
                            </SegmentedControlItem>
                          </TooltipTrigger>
                          <TooltipPopup>{t(`searchTable.views.${item}`)}</TooltipPopup>
                        </Tooltip>
                      )
                    })}
                  </SegmentedControlList>
                </SegmentedControl>
              )}
              {showExport && renderExportButton()}
              <EasyColumnConfig
                columns={orderedColumns}
                visibleKeys={visibleKeys}
                onChange={setVisibleKeys}
                onOrderChange={setColumnOrder}
                onReset={() => {
                  setColumnOrder(getColumnOrder(columns))
                  setVisibleKeys(getDefaultVisibleKeys(columns))
                }}
              />
            </div>
          </div>
        )}
      />

      <div className="relative">
        {renderContent()}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm sm:justify-between">
        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-[var(--muted-foreground)]">
            {t('searchTable.total', { total })}
          </span>
          {showPageSizeSelector && (
            <Select<number>
              value={internalPageSize}
              onValueChange={(v) => v != null && handlePageSizeChange(v)}
              items={Object.fromEntries(pageSizeOptions.map((n) => [n, t('searchTable.pageSize', { size: n })]))}
            >
              <SelectTrigger size="sm" className="h-7 w-28" aria-label={t('searchTable.pageSizeLabel')}>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={n}>
                    {t('searchTable.pageSize', { size: n })}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">
            {t('searchTable.pageInfo', { page, totalPages })}
          </span>
          {showPageJumper && (
            <div className="hidden items-center gap-1 sm:flex">
              <span className="text-[var(--muted-foreground)]">{t('searchTable.jumpTo')}</span>
              <input
                type="number"
                aria-label={t('searchTable.jumpToPage')}
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()}
                onBlur={handleJumpPage}
                className="h-7 w-12 rounded-md border border-[var(--border)] bg-transparent px-1.5 text-center text-sm outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
              />
              <span className="text-[var(--muted-foreground)]">{t('searchTable.page')}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label={t('searchTable.previousPage')}
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('searchTable.nextPage')}
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
