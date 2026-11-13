import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, fallback: string) => fallback }) }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Quote', () => ({ Quote: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('./Confirm', () => ({ Confirm: () => null }))

import { PushCategoryList } from './PushCategoryList'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('PushCategoryList', () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (onChange: (enabled: IPushCategory[]) => void) =>
    act(() =>
      root.render(<PushCategoryList categories={['state', 'connect']} enabled={['state']} onChange={onChange} />)
    )

  it('sends one change for a click on the switch itself', () => {
    const onChange = vi.fn()
    render(onChange)
    const switches = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    act(() => switches[1].click())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['state', 'connect'])
  })

  it('sends one change for a click on the row', () => {
    const onChange = vi.fn()
    render(onChange)
    const rows = container.querySelectorAll<HTMLElement>('.MuiListItemButton-root')
    act(() => rows[0].click())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([])
  })
})
