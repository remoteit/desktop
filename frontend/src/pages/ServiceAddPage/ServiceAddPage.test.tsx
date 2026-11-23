import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ServiceAddPage } from './ServiceAddPage'

const seen = vi.hoisted(() => ({ editable: undefined as boolean | undefined, submit: undefined as any }))
const cloudAddService = vi.hoisted(() => vi.fn())
vi.mock('react-redux', () => ({
  useDispatch: () => ({ applicationTypes: { fetchAll: vi.fn() }, ui: { set: vi.fn() }, devices: { cloudAddService } }),
  useSelector: (select: any) => select({ ui: { setupServicesLimit: 20 } }),
}))
vi.mock('../../components/ServiceForm', () => ({
  ServiceForm: ({ editable, onSubmit }: { editable: boolean; onSubmit: (form: IService) => void }) => {
    seen.editable = editable
    seen.submit = onSubmit
    return null
  },
}))
vi.mock('../../components/LicensingServiceNotice', () => ({ LicensingServiceNotice: () => null }))
vi.mock('../../components/Diagram', () => ({ Diagram: () => null }))
vi.mock('../../components/Container', () => ({
  Container: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('adding a service', () => {
  it('a virtual device is given the whole form, and its service is added through graphql', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const device = {
      id: 'virtual',
      virtual: true,
      configurable: false,
      host: 'nas.local',
      permissions: ['MANAGE'],
      services: [],
    } as unknown as IDevice
    try {
      await act(async () =>
        root.render(
          <MemoryRouter>
            <ServiceAddPage device={device} />
          </MemoryRouter>
        )
      )
      expect(seen.editable).toBe(true)
      const form = { name: 'game', typeID: 32769, host: 'nas.local', port: 19132, enabled: true } as IService
      await act(async () => seen.submit(form))
      expect(cloudAddService).toHaveBeenCalledWith({ form, deviceId: 'virtual', ports: undefined })
    } finally {
      act(() => root.unmount())
    }
  })
})
