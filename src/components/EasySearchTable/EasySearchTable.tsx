import { useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Download, LayoutGrid, List, Plus, Table2 } from 'lucide-react'
import { useEasyT } from '@/i18n'
import { Card, CardContent } from '@/components/ui/card'
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
import { EasySearchForm } from './EasySearchForm'
import { EasyColumnConfig } from './EasyColumnConfig'
import type { ColumnDef, SearchFieldDef, SearchParams, SearchTableView } from './types'

export type { ColumnDef, SearchFieldDef, SearchParams, SearchTableView, PageResult } from './types'

export type EasySearchTableExportContext<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  visibleKeys: string[]
  searchValues: Record<string, unknown>
  exportParams: Record<string, unknown>
  close: () => void
  exportCurrentData: () => void
}

export type EasySearchTableProps<T> = {
  columns: ColumnDef<T>[]
  searchFields: SearchFieldDef[]
  data: T[]
  total: number
  page: number
  pageSize: number
  onSearch: (params: SearchParams) => void
  loading?: boolean
  defaultView?: SearchTableView
  skeletonRows?: number
  toolbarLeft?: ReactNode
  onAdd?: () => void
  addLabel?: ReactNode
  showExport?: boolean
  exportFileName?: string
  renderExportContent?: (context: EasySearchTableExportContext<T>) => ReactNode
  renderCard?: (record: T, columns: ColumnDef<T>[]) => ReactNode
  renderListItem?: (record: T, columns: ColumnDef<T>[]) => ReactNode
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

export function EasySearchTable<T extends Record<string, unknown>>({
  columns,
  searchFields,
  data,
  total,
  page,
  pageSize,
  onSearch,
  loading,
  defaultView = 'table',
  skeletonRows = 5,
  toolbarLeft,
  onAdd,
  addLabel,
  showExport = true,
  exportFileName = 'table-data.csv',
  renderExportContent,
  renderCard,
  renderListItem,
}: EasySearchTableProps<T>) {
  const t = useEasyT()
  const [columnOrder, setColumnOrder] = useState(() => getColumnOrder(columns))
  const [visibleKeys, setVisibleKeys] = useState(() => getDefaultVisibleKeys(columns))
  const availableViews = useMemo(() => {
    const views: SearchTableView[] = ['table']
    if (renderCard) views.push('card')
    if (renderListItem) views.push('list')
    return views
  }, [renderCard, renderListItem])

  const [view, setView] = useState<SearchTableView>(() =>
    availableViews.includes(defaultView) ? defaultView : availableViews[0],
  )
  const [searchValues, setSearchValues] = useState<Record<string, unknown>>({})
  const [exportOpen, setExportOpen] = useState(false)

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const exportParams = useMemo(() => ({ ...searchValues }), [searchValues])

  function handleSearch(values: Record<string, unknown>) {
    setSearchValues(values)
    onSearch({ page: 1, pageSize, ...values })
  }

  function handleReset() {
    setSearchValues({})
    onSearch({ page: 1, pageSize })
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return
    onSearch({ page: newPage, pageSize })
  }

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
        size="sm"
        onClick={renderExportContent ? undefined : exportCurrentData}
      >
        <Download className="size-4" />
        {t('actions.export')}
      </Button>
    )

    if (!renderExportContent) return button

    return (
      <Popover open={exportOpen} onOpenChange={setExportOpen}>
        <PopoverTrigger asChild>{button}</PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          {renderExportContent(exportContext)}
        </PopoverContent>
      </Popover>
    )
  }

  function renderDefaultCard(record: T) {
    const [titleColumn, ...detailColumns] = visibleColumns
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        {titleColumn && (
          <div className="mb-3 truncate text-base font-semibold text-[var(--card-foreground)]">
            {renderCell(record, titleColumn)}
          </div>
        )}
        <div className="space-y-2">
          {detailColumns.map((col) => (
            <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
              <span className="shrink-0 text-[var(--muted-foreground)]">{t(col.headerKey)}</span>
              <span className="min-w-0 truncate text-right">{renderCell(record, col)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderDefaultListItem(record: T) {
    const [titleColumn, ...detailColumns] = visibleColumns
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(180px,1.2fr)_minmax(0,2fr)] md:items-center">
          <div className="min-w-0 truncate text-base font-semibold text-[var(--card-foreground)]">
            {titleColumn ? renderCell(record, titleColumn) : '—'}
          </div>
          <div className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {detailColumns.map((col) => (
              <div key={col.key} className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-[var(--muted-foreground)]">{t(col.headerKey)}</span>
                <span className="min-w-0 truncate">{renderCell(record, col)}</span>
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
        <Table className="min-w-[720px] table-fixed">
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

  function renderContent() {
    if (loading) return renderSkeletonContent()

    if (view === 'card') {
      return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.length === 0 ? (
            <div className="col-span-full flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
              —
            </div>
          ) : (
            data.map((record, idx) => (
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
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
              —
            </div>
          ) : (
            data.map((record, idx) => (
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
      <Table className="min-w-[720px] table-fixed">
        <TableHeader>
          <TableRow>
            {visibleColumns.map((col) => (
              <TableHead
                key={col.key}
                className="whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {t(col.headerKey)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="h-24 text-center text-[var(--muted-foreground)]"
              >
                —
              </TableCell>
            </TableRow>
          ) : (
            data.map((record, idx) => (
              <TableRow key={(record['id'] as string) ?? idx}>
                {visibleColumns.map((col) => (
                  <TableCell key={col.key} className="whitespace-nowrap">
                    <div className="truncate" title={String(record[col.key] ?? '')}>
                      {renderCell(record, col)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <EasySearchForm
          fields={searchFields}
          onSearch={handleSearch}
          onReset={handleReset}
          onValuesChange={setSearchValues}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {onAdd && (
              <Button size="sm" onClick={onAdd}>
                <Plus className="size-4" />
                {addLabel ?? t('actions.add')}
              </Button>
            )}
            {showExport && renderExportButton()}
            {toolbarLeft}
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
                      <SegmentedControlItem key={item} value={item}>
                        <Icon className="size-3.5" />
                        <span className="hidden sm:inline">{t(`searchTable.views.${item}`)}</span>
                      </SegmentedControlItem>
                    )
                  })}
                </SegmentedControlList>
              </SegmentedControl>
            )}
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

        <div className="relative">
          {renderContent()}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">
            {t('searchTable.total', { total })}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted-foreground)]">
              {t('searchTable.pageInfo', { page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
