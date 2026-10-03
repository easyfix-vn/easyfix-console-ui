import type { ReactNode } from 'react'

export type SearchMode = 'auto' | 'manual'
export type SearchFormValues = Record<string, unknown>

// 搜索表单字段配置。业务页面只需要描述字段，不需要关心表单布局。
export type SearchFieldDef = {
  key: string
  labelKey: string
  placeholder?: string
  colSpan?: number
  defaultValue?: unknown
} & (
  | { type: 'input' }
  | { type: 'select'; options?: Array<{ label: string; value: string }> }
  | { type: 'dateRange'; showTime?: boolean }
  | { type: 'custom'; render: (value: unknown, onChange: (value: unknown) => void) => ReactNode }
)
