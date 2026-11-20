import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ServiceEditPage } from './ServiceEditPage'

const serving = vi.hoisted(() => ({ listen: '' }))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ applicationTypes: { fetchAll: vi.fn() } }),
  useSelector: () => ({}),
}))
vi.mock('../../hooks/useDeviceApps', () => ({
  useServiceApp: () => ({
    app: { listen: serving.listen, serviceId: 'app-service' },
    appService: { listeners: [{ name: null }] },
  }),
}))
vi.mock('../../components/ServiceForm', () => ({
  ServiceForm: ({ listenerDetails }: { listenerDetails: React.ReactNode }) => <>{listenerDetails}</>,
}))
vi.mock('../../components/ServiceSchemeSuggestion', () => ({ ServiceSchemeSuggestion: () => null }))
vi.mock('../../components/ListItemBack', () => ({ ListItemBack: () => null }))
vi.mock('../../components/Gutters', () => ({ Gutters: ({ children }: React.PropsWithChildren) => <>{children}</> }))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('app service configuration', () => {
  it.each([
    ['tcp:60181', '127.0.0.1:60181 (TCP)'],
    ['unix', 'Local socket'],
  ])('shows the reported %s listener instead of the registered route', async (listen, expected) => {
    serving.listen = listen
    const container = document.createElement('div')
    const root = createRoot(container)
    const device = {
      id: 'device',
      name: 'Mac Studio',
      permissions: ['MANAGE'],
      services: [{ id: 'app-service', host: 'remoteit-app-acme-app', port: 80 }],
    } as IDevice
    try {
      await act(async () =>
        root.render(
          <MemoryRouter initialEntries={['/app-service']}>
            <Route path="/:serviceID">
              <ServiceEditPage device={device} />
            </Route>
          </MemoryRouter>
        )
      )
      expect(container.textContent).toContain('Mac Studio')
      expect(container.textContent).toContain(expected)
      expect(container.textContent).not.toContain('remoteit-app-acme-app')
    } finally {
      act(() => root.unmount())
    }
  })
})
