import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const redux = vi.hoisted(() => ({ state: {} as any }))
const browser = vi.hoisted(() => ({ isElectron: true, isRemote: false }))
const windowOpen = vi.hoisted(() => vi.fn())

vi.mock('react-redux', () => ({ useSelector: (select: (s: any) => any) => select(redux.state) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const text = typeof options === 'string' ? options : options?.defaultValue ?? key
      return text.replace(/{{(\w+)}}/g, (_: string, name: string) => options?.[name])
    },
  }),
}))
vi.mock('@common/brand/config', () => ({
  default: { appName: 'Remote.It', package: { author: { email: 'support@remote.it' } } },
}))
vi.mock('../services/browser', () => ({ default: browser, windowOpen }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick, title }: any) => <button onClick={onClick}>{title}</button>,
}))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value }: any) => <button data-copy={value}>copy</button>,
}))
vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal<typeof import('@mui/material')>()),
  Snackbar: ({ open, message }: any) => (open ? <div role="status">{message}</div> : null),
}))

import { AgentOutdatedNotice } from './AgentOutdatedNotice'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const outdated: AgentOutdated = {
  installedVersion: '4.1.0',
  expectedVersion: '4.2.0',
  agentVersion: '4.1.0',
  path: 'C:\\Program Files\\Remote.It\\resources\\remoteit.exe',
  appVersion: '4.0.1',
  arch: 'x64',
  releaseUrl: 'https://github.com/remoteit/desktop/releases/tag/v4.0.1',
  installerLog: 'C:\\Users\\User\\AppData\\Local\\Temp\\remoteit.log',
  appLog: 'C:\\Users\\User\\AppData\\Local\\remoteit\\log\\combined.log',
}

describe('AgentOutdatedNotice', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (agent?: AgentOutdated) => {
    redux.state = { binaries: { outdated: agent } }
    act(() => root.render(<AgentOutdatedNotice />))
  }
  const text = () => document.body.textContent || ''
  const button = (label: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent === label)
  const click = (label: string) => act(() => button(label)?.click())

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    browser.isElectron = true
    browser.isRemote = false
    windowOpen.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('shows nothing while the agent is current', () => {
    render()
    expect(text()).not.toContain('out of date')
  })

  it('shows nothing outside the desktop app', () => {
    browser.isElectron = false
    render(outdated)
    expect(text()).not.toContain('out of date')
  })

  it('warns without blocking and recommends reinstalling', () => {
    render(outdated)
    expect(text()).toContain(
      'The Remote.It system agent on this computer is out of date. Reinstall Remote.It to update it.'
    )
  })

  it('explains the versions, the steps and the details support needs', () => {
    render(outdated)
    click('Details')

    expect(text()).toContain('This computer is running system agent 4.1.0, and Remote.It 4.0.1 needs 4.2.0.')
    expect(text()).toContain('Download the x64 installer for Remote.It 4.0.1.')
    expect(text()).toContain('email support@remote.it with the details below')
    const copied = document.querySelector('[data-copy]')?.getAttribute('data-copy')
    expect(copied).toBe(
      [
        'Remote.It 4.0.1 (Windows x64)',
        'Agent on disk: 4.1.0 (C:\\Program Files\\Remote.It\\resources\\remoteit.exe)',
        'Agent expected: 4.2.0',
        'Agent running: 4.1.0',
        'Installer log: C:\\Users\\User\\AppData\\Local\\Temp\\remoteit.log',
        'App log: C:\\Users\\User\\AppData\\Local\\remoteit\\log\\combined.log',
      ].join('\n')
    )
  })

  it('opens this version’s release for the installer', () => {
    render(outdated)
    click('Details')
    click('Download installer')
    expect(windowOpen).toHaveBeenCalledWith(outdated.releaseUrl, '_blank', true)
  })

  it('stays dismissed until the versions change', () => {
    render(outdated)
    click('Close')
    expect(button('Details')).toBeUndefined()

    render({ ...outdated, installedVersion: '4.0.0' })
    expect(button('Details')).toBeDefined()
  })
})
