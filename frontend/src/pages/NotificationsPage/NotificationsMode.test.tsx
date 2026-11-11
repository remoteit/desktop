import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { updateNotificationSettings, user } = vi.hoisted(() => ({
  updateNotificationSettings: vi.fn(),
  user: { notificationSettings: {} as INotificationSetting },
}))
vi.mock('../../store', () => ({}))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ user }),
  useDispatch: () => ({ user: { updateNotificationSettings } }),
}))
vi.mock('../../services/browser', () => ({ default: { isMobile: false } }))
vi.mock('../../components/Icon', () => ({ Icon: () => null }))
// Read and set on its own (ProductNotificationsSetting.test.tsx).
vi.mock('../../components/ProductNotificationsSetting', () => ({ ProductNotificationsSetting: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, a: any) => (typeof a === 'string' ? a : a.defaultValue) }),
}))

import { NotificationMode } from './NotificationsMode'
import { lightColors } from '../../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

let root: Root
// Each row is a list button holding its own switch.
const toggle = (label: string) =>
  [...document.body.querySelectorAll('.MuiListItemButton-root')]
    .find(row => row.querySelector('.MuiListItemText-primary')?.textContent === label)!
    .querySelector<HTMLInputElement>('input[type="checkbox"]')!

async function render(settings: INotificationSetting) {
  user.notificationSettings = settings
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <NotificationMode />
      </ThemeProvider>
    )
  )
}

beforeEach(() => {
  document.body.innerHTML = ''
  updateNotificationSettings.mockReset()
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => act(() => root.unmount()))

describe('Device restore emails', () => {
  it('is on until switched off (null is on), and says the owner is always told', async () => {
    await render({ emailNotifications: true, restoreNotifications: null })
    expect(document.body.textContent).toContain('Its owner is always emailed')
    expect(toggle('Device restore emails').checked).toBe(true)
    await act(async () => toggle('Device restore emails').click())
    expect(updateNotificationSettings).toHaveBeenCalledWith(expect.objectContaining({ restoreNotifications: false }))
  })

  it('switches back on', async () => {
    await render({ emailNotifications: true, restoreNotifications: false })
    expect(toggle('Device restore emails').checked).toBe(false)
    await act(async () => toggle('Device restore emails').click())
    expect(updateNotificationSettings).toHaveBeenCalledWith(expect.objectContaining({ restoreNotifications: true }))
  })

  it('keeps its setting when another switch changes', async () => {
    await render({ emailNotifications: true, restoreNotifications: false })
    await act(async () => toggle('Webhook').click())
    expect(updateNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({ urlNotifications: true, restoreNotifications: false })
    )
  })
})
