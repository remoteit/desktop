import type { DeviceApp, DeviceAppService } from '../services/graphQLDeviceApps'

/* A test app's services as graphql gives them where its fixture names none: its one service, the primary, from its
   single-service fields (serviceId, protocol, portSetting) — none for an app that serves nothing. */
export function withServices(app: Omit<DeviceApp, 'services'> & { services?: DeviceAppService[] }): DeviceApp {
  if (app.services) return app as DeviceApp
  const serves = !!app.serviceId || !!app.protocol
  const primary: DeviceAppService = {
    key: null,
    name: app.name,
    protocol: app.protocol,
    multiPort: false,
    port: null,
    portSetting: app.portSetting ?? null,
    listeners: [],
    serviceId: app.serviceId,
    ports: [],
  }
  return { ...app, services: serves ? [primary] : [] }
}
