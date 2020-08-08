
import { r3 } from './remote.it'

export interface RawDeviceResponse {
  deviceID: string
  shares: ShareInfo[]
  services: SimplifiedService[]
}

export class SharingManager {
  public static async share({
    allServices,
    contacts,
    deviceID,
    scripting,
    sharedServices,
  }: {
    allServices: IService[]
    contacts: string[]
    deviceID: string
    scripting: boolean
    sharedServices: string[]
  }): Promise<RawDeviceResponse> {
    const services = this.formatServices(allServices, sharedServices)
    return await r3.post('/developer/devices/share/', {
      actionurl: this.actionURL,
      authhash: this.authHash,
      function: 'share_devices',
      label: 'sharing',
      options: JSON.stringify({
        devices: deviceID,
        emails: contacts.toString(),
        state: 'on',
        scripting,
        services,
      }),
    })
  }

  private static formatServices(
    all: IService[],
    shared: string[]
  ): { [id: string]: boolean } {
    return all.reduce((all, s) => {
      all[s.id] = shared.includes(s.id)
      return all
    }, {} as { [id: string]: boolean })
  }

  public static async unshare({
    deviceID,
    email,
  }: {
    deviceID: string
    email: string
  }): Promise<any> {
    return await r3.post(
      `/developer/device/share/${deviceID}/${encodeURIComponent(email)}`,
      {
        devices: deviceID,
        emails: email,
        state: 'off',
        scripting: false,
      }
    )
  }

  public static async update({
    allServices,
    deviceID,
    email,
    scripting,
    sharedServices,
  }: {
    allServices: IService[]
    deviceID: string
    email: string
    scripting: boolean
    sharedServices: string[]
  }): Promise<any> {
    const services = this.formatServices(allServices, sharedServices)
    return await r3.post('/developer/devices/share/', {
      actionurl: this.actionURL,
      authhash: this.authHash,
      function: 'share_devices',
      label: 'sharing',
      options: JSON.stringify({
        devices: deviceID,
        emails: email,
        state: 'on',
        scripting,
        services,
      }),
      state: 'on',
    })
  }

  private static get authHash(): string | undefined {
    return r3.authHash
  }
  private static get actionURL(): string {
    return window.location.origin + '/invite/accept?type=shareDevices&id='
  }
}
