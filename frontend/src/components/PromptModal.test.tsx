import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'
import { getApplication } from '@common/applications'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, fallback: string) => fallback }) }))
vi.mock('../services/browser', () => ({ default: {} }))
vi.mock('../helpers/connectionHelper', () => ({ isFileToken: () => false }))
vi.mock('./InlineFileFieldSetting', () => ({}))

import { PromptModal } from './PromptModal'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const connection: IConnection = { ...DEFAULT_CONNECTION, id: 'service-1', typeID: 7 }

describe('PromptModal', () => {
  let root: Root
  let container: HTMLDivElement
  const onSubmit = vi.fn()

  const render = (update: Partial<IConnection>) =>
    act(() =>
      root.render(
        <PromptModal
          app={getApplication(undefined, { ...connection, ...update })}
          open
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />
      )
    )
  const save = () => act(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Save')?.click())

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    onSubmit.mockClear()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('blocks Save while a missing value is empty', () => {
    render({})

    expect(document.querySelector('input')).not.toBeNull()
    save()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('follows the host arriving while open instead of keeping its empty field', () => {
    render({})
    render({ host: 'abc.p021.r3proxy.com' })

    expect(document.body.textContent).toContain('https://abc.p021.r3proxy.com')
    save()
    expect(onSubmit).toHaveBeenCalledWith({})
  })
})
