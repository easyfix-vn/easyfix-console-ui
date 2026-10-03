import type { SearchFieldDef, SearchFormValues } from './types'

export const EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD = 5
export const EASY_SEARCH_FORM_COLLAPSED_FIELDS = EASY_SEARCH_FORM_DEFAULT_COLLAPSE_THRESHOLD

export function getSearchFieldColumnSpan(field: SearchFieldDef, columns: number) {
  const span = field.colSpan ?? 1
  return Number.isFinite(span) ? Math.min(columns, Math.max(1, Math.floor(span))) : 1
}

export function getSearchFieldDefaultValues(
  fields: SearchFieldDef[],
  defaultValues?: SearchFormValues,
): SearchFormValues {
  return { ...Object.fromEntries(
    fields.flatMap((field) => {
      if (field.defaultValue !== undefined) {
        return [[field.key, field.defaultValue]]
      }

      // Custom controlled components such as Base UI NumberField use null as
      // their empty value. Supplying it from the first render avoids switching
      // from uncontrolled to controlled after the first change.
      return field.type === 'custom' ? [[field.key, null]] : []
    }),
  ), ...defaultValues }
}
