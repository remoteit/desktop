import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const redux = vi.hoisted(() => ({
  state: {
    applicationTypes: { all: [{ id: 8, name: 'HTTPS', port: 443, scheme: 'https', description: '' }] },
    backend: {},
    ui: {},
  } as any,
}))

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(redux.state),
  useDispatch: () => ({ ui: { set: vi.fn() } }),
}))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../hooks/useApplication', () => ({ useApplication: () => ({ urlForm: true, use: '' }) }))
vi.mock('./ServiceFormApplications', () => ({ ServiceFormApplications: () => null }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: () => null }))

import '../store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { DEFAULT_SERVICE } from '@common/constants'
import { jssTheme } from '../styling/theme'
import { ServiceForm } from './ServiceForm'

const theme = createTheme(jssTheme(false))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('ServiceForm for a web service', () => {
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

  const labels = (hostPort?: boolean) => {
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <ServiceForm
            adding
            compact
            editable
            thisDevice={false}
            hostPort={hostPort}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        </ThemeProvider>
      )
    )
    return [...container.querySelectorAll('label')].map(label => label.textContent?.replace(/\s*\*$/, ''))
  }

  it('asks for a Service URL', () => {
    expect(labels()).toEqual(expect.arrayContaining(['Service URL']))
    expect(labels()).not.toContain('Service Host')
  })

  it('asks for a host and port instead when the target cannot keep a URL path', () => {
    expect(labels(true)).toEqual(expect.arrayContaining(['Service Host', 'Service Port']))
    expect(labels(true)).not.toContain('Service URL')
  })
})

describe('ServiceForm for a type the API does not list', () => {
  it('saves the service with the type it has', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onSubmit = vi.fn()
    const minecraft = { ...DEFAULT_SERVICE, id: 'S', typeID: 41, name: 'World', port: 25565, enabled: true }
    await act(async () =>
      root.render(
        <ThemeProvider theme={theme}>
          <ServiceForm compact editable thisDevice={false} service={minecraft} onSubmit={onSubmit} onCancel={vi.fn()} />
        </ThemeProvider>
      )
    )
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 'S', typeID: 41, name: 'World', port: 25565 }))
    act(() => root.unmount())
    container.remove()
  })
})
