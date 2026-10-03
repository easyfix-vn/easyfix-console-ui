import type { ReactNode } from 'react'

export type { SearchFieldDef, SearchMode } from '../EasySearchForm/types'

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
