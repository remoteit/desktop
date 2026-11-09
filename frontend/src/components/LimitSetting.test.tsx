import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// A licence card's feature lines: the account's base for its proxies' names is said where a licence gives it — the
// Enterprise plan, or the Proxy base add-on —, and nothing where none does, as the AI agent's.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }),
}))
vi.mock('../models/plans', () => ({ humanizeDays: () => '' }))
vi.mock('@mui/material', () => ({
  Typography: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  LinearProgress: () => null,
}))

import { LimitSetting } from './LimitSetting'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('LimitSetting', () => {
  let root: Root
  let container: HTMLDivElement

  const line = (name: string, value: boolean) => {
    act(() => root.render(<LimitSetting limit={{ name, value, actual: 0 } as any} />))
    return container.textContent
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('a base for proxies: said where a licence gives it, nothing where none does', () => {
    expect(line('proxy-base', true)).toBe('An account base for proxies is available')
    expect(line('proxy-base', false)).toBe('')
  })
})
