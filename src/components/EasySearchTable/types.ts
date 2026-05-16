import type { ReactNode } from 'react'

// 搜索表单字段配置。业务页面只需要描述字段，不需要关心表单布局。
export type SearchFieldDef = {
  key: string
  labelKey: string
  placeholder?: string
  colSpan?: number
} & (
  | { type: 'input' }
  | { type: 'select'; options?: Array<{ label: string; value: string }> }
  | { type: 'dateRange'; showTime?: boolean }
  | { type: 'custom'; render: (value: unknown, onChange: (value: unknown) => void) => ReactNode }
)

// 列配置同时服务表格、默认卡片和默认列表视图。
export type ColumnDef<T> = {
  key: string
  headerKey: string
  render?: (value: unknown, record: T) => ReactNode
  exportable?: boolean
  exportValue?: (value: unknown, record: T) => string | number | null | undefined
  sortable?: boolean
  width?: string | number
  fixed?: 'left' | 'right'
  defaultVisible?: boolean
  hidden?: boolean
}

// 内置三种数据展示视图，业务可通过 renderCard/renderListItem 覆盖模板。
export type SearchTableView = 'table' | 'card' | 'list'

export type SortOrder = 'asc' | 'desc' | null
export type SortState = { key: string; order: SortOrder }

export type SearchParams = {
  page: number
  pageSize: number
  [key: string]: unknown
}

export type PageResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}
