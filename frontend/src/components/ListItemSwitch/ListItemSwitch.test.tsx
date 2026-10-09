import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../Icon', () => ({ Icon: () => null }))

import { ListItemSwitch } from './ListItemSwitch'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('ListItemSwitch', () => {
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

  it('reports one change for a click on the switch, and one for a click on the row', () => {
    const onClick = vi.fn()
    act(() => root.render(<ListItemSwitch label="Mobile push" checked onClick={onClick} />))

    act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenLastCalledWith(false)

    act(() => container.querySelector<HTMLElement>('.MuiListItemButton-root')!.click())
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
