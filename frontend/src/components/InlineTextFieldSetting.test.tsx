import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { setting } = vi.hoisted(() => ({ setting: { props: undefined as any } }))
// The row around the field (edit and view states, Save) is InlineSetting's: here, what it is told.
vi.mock('./InlineSetting', () => ({
  InlineSetting: (props: any) => {
    setting.props = props
    return <form>{props.children}</form>
  },
}))

import { InlineTextFieldSetting } from './InlineTextFieldSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render(element: React.ReactElement) {
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(element))
  await act(async () => setting.props.onShowEdit())
  return container
}

async function type(container: HTMLElement, value: string) {
  const input = container.querySelector('input')!
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    set.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('InlineTextFieldSetting validate and helper', () => {
  it('shows why a value cannot be had as it is typed, and is not saved while it has a reason', async () => {
    const onSave = vi.fn()
    const container = await render(
      <InlineTextFieldSetting
        label="Name"
        value="pi"
        validate={v => (v.includes('-') ? 'No dashes' : undefined)}
        onSave={onSave}
      />
    )
    await type(container, 'p-i')
    expect(container.textContent).toContain('No dashes')
    expect(setting.props.invalid).toBe(true)

    await type(container, 'pi2')
    expect(container.textContent).not.toContain('No dashes')
    expect(setting.props.invalid).toBe(false)
    await act(async () => setting.props.onSubmit())
    expect(onSave).toHaveBeenCalledWith('pi2')
  })

  it('an answer that comes later counts only for the value still typed', async () => {
    let answer: (reason?: string) => void = () => {}
    const container = await render(
      <InlineTextFieldSetting
        label="Slug"
        value="acme"
        validate={() => new Promise<string | undefined>(resolve => (answer = resolve))}
      />
    )
    await type(container, 'taken')
    const first = answer
    await type(container, 'free')
    await act(async () => first('taken is taken'))
    expect(container.textContent).not.toContain('taken is taken')
    await act(async () => answer('free is taken'))
    expect(container.textContent).toContain('free is taken')
  })

  it('puts the helper under the field, given what is typed, when there is no problem', async () => {
    const container = await render(<InlineTextFieldSetting label="Name" value="pi" helper={v => `is ${v}`} />)
    await type(container, 'cam')
    expect(container.textContent).toContain('is cam')
  })
})
