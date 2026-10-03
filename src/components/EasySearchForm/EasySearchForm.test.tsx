import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EasyI18nProvider } from '@/i18n'
import { EasySearchForm, type SearchFieldDef } from './index'
import { EasySearchForm as LegacyEasySearchForm, getSearchFieldDefaultValues } from '../EasySearchTable/EasySearchForm'

const fields: SearchFieldDef[] = [{ key: 'name', labelKey: 'Name', type: 'input' }]
let formWidth = 390
let observers: Array<{ callback: ResizeObserverCallback; target: Element; disconnect: ReturnType<typeof vi.fn> }> = []

function resizeForm(width: number) {
  formWidth = width
  act(() => observers.forEach(({ callback, target }) => callback(
    [{ target, contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver,
  )))
}

function renderForm(element: ReactElement) {
  return render(<EasyI18nProvider locale="en-US">{element}</EasyI18nProvider>)
}

describe('EasySearchForm', () => {
  beforeEach(() => {
    formWidth = 390
    observers = []
    vi.stubGlobal('ResizeObserver', class {
      disconnect = vi.fn()
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        if (target.getAttribute('data-slot') !== 'easy-search-form-root') return
        observers.push({ callback: this.callback, target, disconnect: this.disconnect })
        this.callback([{ target, contentRect: { width: formWidth } } as ResizeObserverEntry], this as unknown as ResizeObserver)
      }
      unobserve() {}
    })
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    })))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('兼容旧导入路径，并由独立模块提供默认值工具', () => {
    expect(LegacyEasySearchForm).toBe(EasySearchForm)
    expect(getSearchFieldDefaultValues(fields, { name: 'Alice' })).toEqual({ name: 'Alice' })
  })

  it('manual 编辑与失焦不查询，Enter 提交当前条件并关联可见标签', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    renderForm(<EasySearchForm fields={fields} searchMode="manual" onSearch={onSearch} />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    const label = screen.getByText('Name', { selector: 'label' })
    expect(label).toHaveAttribute('for', input.id)
    await user.type(input, 'Alice')
    await user.tab()
    expect(onSearch).not.toHaveBeenCalled()
    await user.click(input)
    await user.keyboard('{Enter}')
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ name: 'Alice' })
  })

  it('默认 auto 在真正离开输入时查询，编辑期间只通知值变化', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const onValuesChange = vi.fn()
    renderForm(<><EasySearchForm fields={fields} onSearch={onSearch} onValuesChange={onValuesChange} /><button>Outside</button></>)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Alice')
    expect(onSearch).not.toHaveBeenCalled()
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'Alice' })
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ name: 'Alice' })
  })

  it('auto 输入后点击 Search 只提交一次，不重复提交失焦查询', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    renderForm(<EasySearchForm fields={fields} onSearch={onSearch} />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ name: 'Alice' })
  })

  it('无 onReset 时重置合并默认值并只查询一次，不先提交草稿', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const onValuesChange = vi.fn()
    renderForm(<EasySearchForm fields={[{ ...fields[0], defaultValue: 'Field default' }]}
      defaultValues={{ name: 'Form default', status: 'active' }}
      onSearch={onSearch} onValuesChange={onValuesChange} />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).toHaveValue('Form default')
    await user.clear(input)
    await user.type(input, 'Draft')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(input).toHaveValue('Form default')
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'Form default', status: 'active' })
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ name: 'Form default', status: 'active' })
  })

  it.each(['auto', 'manual'] as const)('%s 提供 onReset 时只回调重置值，由调用方负责查询', async (searchMode) => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const onReset = vi.fn()
    renderForm(<EasySearchForm fields={fields} defaultValues={{ name: 'Alice' }}
      searchMode={searchMode} onSearch={onSearch} onReset={onReset} />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(input)
    await user.type(input, 'Draft')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledExactlyOnceWith({ name: 'Alice' })
    expect(onSearch).not.toHaveBeenCalled()
    expect(input).toHaveValue('Alice')
  })

  it('受控 values 编辑与重置只通知回调，显示值等待父级更新', () => {
    const onSearch = vi.fn()
    const onReset = vi.fn()
    const onValuesChange = vi.fn()
    const form = (name: string) => <EasyI18nProvider locale="en-US"><EasySearchForm fields={fields}
      values={{ name }} defaultValues={{ name: 'Default' }} searchMode="manual"
      onSearch={onSearch} onReset={onReset} onValuesChange={onValuesChange} /></EasyI18nProvider>
    const { rerender } = render(form('Alice'))
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'Bob' } })
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'Bob' })
    expect(input).toHaveValue('Alice')
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: 'Default' })
    expect(onReset).toHaveBeenCalledExactlyOnceWith({ name: 'Default' })
    expect(input).toHaveValue('Alice')
    expect(onSearch).not.toHaveBeenCalled()
    rerender(form('Bob'))
    expect(input).toHaveValue('Bob')
  })

  it('custom 默认值保留 false/0/null，显式清空 null 后重置才恢复默认值', () => {
    const onSearch = vi.fn()
    const customFields: SearchFieldDef[] = [
      { key: 'count', labelKey: 'Count', type: 'custom', defaultValue: 4,
        render: (value, onChange) => <><output data-testid="count">{String(value)}</output><button onClick={() => onChange(null)}>Clear count</button></> },
      ...([['zero', 0], ['false', false], ['null', null], ['empty', undefined]] as const).map(([key, defaultValue]): SearchFieldDef => ({
        key, labelKey: key, type: 'custom', defaultValue,
        render: (value) => <output data-testid={key}>{String(value)}</output>,
      })),
    ]
    renderForm(<EasySearchForm fields={customFields} onSearch={onSearch} />)
    expect(screen.getByTestId('count')).toHaveTextContent('4')
    expect(screen.getByTestId('zero')).toHaveTextContent('0')
    expect(screen.getByTestId('false')).toHaveTextContent('false')
    expect(screen.getByTestId('null')).toHaveTextContent('null')
    expect(screen.getByTestId('empty')).toHaveTextContent('null')
    fireEvent.click(screen.getByRole('button', { name: 'Clear count' }))
    expect(screen.getByTestId('count')).toHaveTextContent('null')
    expect(onSearch).toHaveBeenLastCalledWith({ count: null, zero: 0, false: false, null: null, empty: null })
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByTestId('count')).toHaveTextContent('4')
    expect(onSearch).toHaveBeenLastCalledWith({ count: 4, zero: 0, false: false, null: null, empty: null })
  })

  it('重建 fields 或切换语言不清空当前编辑，重置使用最新默认值', () => {
    const onSearch = vi.fn()
    const form = (labelKey: string) => <EasyI18nProvider locale="en-US"><EasySearchForm
      fields={[{ key: 'name', labelKey, type: 'input', defaultValue: labelKey }]}
      searchMode="manual" onSearch={onSearch} /></EasyI18nProvider>
    const { rerender } = render(form('Name'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft' } })
    rerender(form('Tên'))
    expect(screen.getByRole('textbox', { name: 'Tên' })).toHaveValue('Draft')
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onSearch).toHaveBeenLastCalledWith({ name: 'Tên' })
  })

  it('本地折叠默认值和 onCollapsedChange 控制可见字段与 aria-expanded', async () => {
    const user = userEvent.setup()
    const onCollapsedChange = vi.fn()
    const manyFields: SearchFieldDef[] = [fields[0], { key: 'status', labelKey: 'Status', type: 'input' }]
    renderForm(<EasySearchForm fields={manyFields} collapseThreshold={1} defaultCollapsed={false}
      onCollapsedChange={onCollapsedChange} onSearch={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Collapse' }))
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true)
    expect(screen.queryByRole('textbox', { name: 'Status' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('受控折叠与旧 onToggle 等待父级更新，不改变自己的可见字段', () => {
    const onToggle = vi.fn()
    const onCollapsedChange = vi.fn()
    const manyFields: SearchFieldDef[] = [fields[0], { key: 'status', labelKey: 'Status', type: 'input' }]
    const form = (collapsed: boolean) => <EasyI18nProvider locale="en-US"><EasySearchForm fields={manyFields}
      collapseThreshold={1} collapsed={collapsed} onToggle={onToggle} onCollapsedChange={onCollapsedChange} onSearch={vi.fn()} /></EasyI18nProvider>
    const { rerender } = render(form(true))
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('textbox', { name: 'Status' })).toBeNull()
    rerender(form(false))
    expect(screen.getByRole('textbox', { name: 'Status' })).toBeInTheDocument()
  })

  it('独立表单按实际容器和 colSpan 换行，在底部插槽与表单行之间移动唯一操作组', () => {
    resizeForm(1024)
    const spanning: SearchFieldDef[] = [
      { key: 'name', labelKey: 'Name', type: 'input', colSpan: 2 },
      { key: 'status', labelKey: 'Status', type: 'input', colSpan: 2 },
    ]
    const { container, unmount } = renderForm(<EasySearchForm fields={spanning} onSearch={vi.fn()}
      className="custom-form" renderFooter={({ actions }) => <div data-testid="footer"><button>Host action</button>{actions}</div>} />)
    const grid = container.querySelector('[data-slot="easy-search-form"]')!
    const footer = screen.getByTestId('footer')
    expect(container.querySelector('[data-slot="easy-search-form-root"]')).toHaveClass('custom-form')
    expect(within(grid).getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(within(footer).queryByRole('button', { name: 'Search' })).toBeNull()
    resizeForm(640)
    expect(within(grid).queryByRole('button', { name: 'Search' })).toBeNull()
    expect(within(footer).getByRole('button', { name: 'Search' })).toBeInTheDocument()
    resizeForm(320)
    expect(screen.getAllByRole('button', { name: 'Search' })).toHaveLength(1)
    expect(within(footer).getByRole('button', { name: 'Search' })).toBeInTheDocument()
    const { disconnect } = observers[0]
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('fields 为空时保留宿主 footer，并传入 null actions，不渲染表单网格', () => {
    const renderFooter = vi.fn(({ actions }) => <div data-testid="footer">{actions}<button>Host action</button></div>)
    const { container } = renderForm(<EasySearchForm fields={[]} onSearch={vi.fn()} renderFooter={renderFooter} />)
    expect(container.querySelector('[data-slot="easy-search-form"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Host action' })).toBeInTheDocument()
    expect(renderFooter).toHaveBeenLastCalledWith({ actions: null })
  })

  it('showActions=false 同时隐藏行内与底部操作，输入仍可用 Enter 查询', () => {
    const onSearch = vi.fn()
    const renderFooter = vi.fn(({ actions }) => <div>{actions}</div>)
    renderForm(<EasySearchForm fields={fields} showActions={false} onSearch={onSearch} renderFooter={renderFooter} />)
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull()
    expect(renderFooter).toHaveBeenLastCalledWith({ actions: null })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ name: 'Alice' })
  })

  it('dateRange 字段以可见标签命名分组并保留可收缩的日期选择器', () => {
    const dateFields: SearchFieldDef[] = [{ key: 'range', labelKey: 'Date range', type: 'dateRange', placeholder: 'Pick dates' }]
    renderForm(<EasySearchForm fields={dateFields} onSearch={vi.fn()} />)
    const group = screen.getByRole('group', { name: 'Date range' })
    expect(within(group).getByRole('button', { name: /Pick dates/ })).toHaveClass('min-w-0', 'max-w-full')
  })

  it('select 自动提交选项，并与可见标签关联', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const selectFields: SearchFieldDef[] = [{ key: 'status', labelKey: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }] }]
    renderForm(<EasySearchForm fields={selectFields} onSearch={onSearch} />)
    const select = screen.getByRole('combobox', { name: 'Status' })
    expect(screen.getByText('Status', { selector: 'label' })).toHaveAttribute('for', select.id)
    await user.click(select)
    await user.click(await screen.findByRole('option', { name: 'Active' }))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith({ status: 'active' })
  })
})
