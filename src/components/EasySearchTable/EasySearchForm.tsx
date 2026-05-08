import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SearchFieldDef } from './types'

export type EasySearchFormProps = {
  fields: SearchFieldDef[]
  onSearch: (values: Record<string, string>) => void
  onReset: () => void
  onValuesChange?: (values: Record<string, string>) => void
  collapsed?: boolean
  onToggle?: () => void
}

const COLLAPSED_FIELDS = 3

export function EasySearchForm({
  fields,
  onSearch,
  onReset,
  onValuesChange,
  collapsed: controlledCollapsed,
  onToggle,
}: EasySearchFormProps) {
  const { t } = useTranslation()
  const [internalCollapsed, setInternalCollapsed] = useState(true)
  const [values, setValues] = useState<Record<string, string>>({})

  const collapsed = controlledCollapsed ?? internalCollapsed
  const toggle = onToggle ?? (() => setInternalCollapsed((v) => !v))

  const visibleFields = collapsed ? fields.slice(0, COLLAPSED_FIELDS) : fields
  const canCollapse = fields.length > COLLAPSED_FIELDS

  function handleChange(key: string, value: string) {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      onValuesChange?.(next)
      return next
    })
  }

  function handleSearch() {
    onSearch(values)
  }

  function handleReset() {
    setValues({})
    onValuesChange?.({})
    onReset()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleFields.map((field) => (
          <div key={field.key} className="flex min-w-0 items-center gap-2">
            <label className="shrink-0 text-sm font-medium text-foreground">
              {t(field.labelKey)}
            </label>
            {field.type === 'input' ? (
              <Input
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            ) : (
              <Select
                value={values[field.key] ?? ''}
                onValueChange={(v) => v !== null && handleChange(field.key, v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          {t('actions.reset')}
        </Button>
        <Button size="sm" onClick={handleSearch}>
          {t('actions.search')}
        </Button>
        {canCollapse && (
          <Button variant="ghost" size="sm" onClick={toggle}>
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
    </div>
  )
}
