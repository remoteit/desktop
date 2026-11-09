import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { ListItemSetting } from './ListItemSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render(element: React.ReactElement) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(element))
  return container.querySelector('button') as HTMLButtonElement
}

describe('a line’s button', () => {
  it('greyed and not clicked while buttonDisabled', async () => {
    const onButtonClick = vi.fn()
    const button = await render(
      <ListItemSetting label="Its records" button="Check now" buttonDisabled onButtonClick={onButtonClick} />
    )
    expect(button.textContent).toBe('Check now')
    expect(button.disabled).toBe(true)
    await act(async () => button.click())
    expect(onButtonClick).not.toHaveBeenCalled()
  })

  it('still clicked on a line disabled alone: its toggle is, not its button', async () => {
    const onButtonClick = vi.fn()
    const button = await render(
      <ListItemSetting label="Connection logging" toggle disabled button="Show Log" onButtonClick={onButtonClick} />
    )
    expect(button.disabled).toBe(false)
    await act(async () => button.click())
    expect(onButtonClick).toHaveBeenCalledTimes(1)
  })
})
