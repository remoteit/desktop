import { BT_UUIDS } from '../constants'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { EventEmitter } from 'events'
import sleep from '../helpers/sleep'

interface DeviceInfo {
  deviceId: string
  name?: string
}

/* 
  Bluetooth low energy interface
  
  Events emitted:
  - updated when state changes
  - characteristic uuid when notification received
  - error when error occurs

  @TODO - add request bluetooth access
*/

export interface BluetoothState {
  characteristics: string[]
  initialized: boolean
  processing: boolean
  connected: boolean
  error: string
}

const defaultState: BluetoothState = {
  characteristics: [],
  initialized: false,
  processing: false,
  connected: false,
  error: '',
}

class Bluetooth extends EventEmitter {
  device: DeviceInfo | null = null
  notifications = new Set<string>()
  state: BluetoothState = { ...defaultState }

  async start() {
    await this.clear()
    await this.initialize()
    await this.connect()
    await this.notify(BT_UUIDS.CONNECT_STATUS)
  }

  async initialize() {
    try {
      await BleClient.initialize()
      console.log('BLUETOOTH INITIALIZED')

      this.device = await BleClient.requestDevice({ services: [BT_UUIDS.SERVICE] })
      console.log('BLUETOOTH DEVICE SELECTED:', this.device)

      this.set('initialized', true)
    } catch (error) {
      this.set('error', 'Failed to initialize Bluetooth')
      console.error('BLUETOOTH INITIALIZATION ERROR:', error)
    }
  }

  async clear() {
    if (this.device) await BleClient.disconnect(this.device.deviceId)
    this.state = { ...defaultState }
  }

  async connect() {
    if (!this.device) {
      console.log('NO DEVICE TO CONNECT TO', this.device)
      return
    }
    try {
      this.set('error', '')
      this.set('processing', true)

      await BleClient.connect(this.device.deviceId)
      await BleClient.getServices(this.device.deviceId).then(services => {
        if (services[0]) {
          this.set(
            'characteristics',
            services[0].characteristics.map(c => c.uuid)
          )
          console.log('BLUETOOTH SERVICES', services)
          this.set('connected', true)
          this.set('processing', false)
        } else console.log('NO SERVICES FOUND')
      })
    } catch (error) {
      this.set('error', 'Failed to connect to device')
      console.error('ERROR processing TO DEVICE', error)
      this.set('connected', true)
      this.set('processing', false)
    }
  }

  async reconnect() {
    if (this.device) await BleClient.disconnect(this.device.deviceId)
    await this.connect()
  }

  async notify(characteristic: string) {
    if (!this.device) return
    try {
      if (this.notifications.has(characteristic)) await this.stopNotify(characteristic)
      this.notifications.add(characteristic)
      console.log('NOTIFY', characteristic)
      await BleClient.startNotifications(this.device.deviceId, BT_UUIDS.SERVICE, characteristic, value => {
        console.log('NOTIFICATION', characteristic, this.parse(value))
        this.emit(characteristic, this.parse(value))
      })
    } catch (error) {
      this.set('error', `Failed to start notification ${characteristic}`)
      console.error('NOTIFY ERROR', error)
    }
  }

  async stopNotify(characteristic: string) {
    if (!this.device) return
    await BleClient.stopNotifications(this.device.deviceId, BT_UUIDS.SERVICE, characteristic)
    this.notifications.delete(characteristic)
    console.log('STOP NOTIFY', characteristic)
  }

  async write(value, characteristic) {
    if (!this.device) return
    try {
      const buffer = new TextEncoder().encode(value)
      const data = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      await BleClient.write(this.device.deviceId, BT_UUIDS.SERVICE, characteristic, data)
      console.log('WRITE SUCCESSFUL', characteristic, value, data)
    } catch (error) {
      this.set('error', `Error writing value ${value} to ${characteristic}`)
      console.error('ERROR WRITING VALUE:', error)
    }
  }

  async writeWifi(ssid: string, password: string) {
    if (!this.device) return
    this.set('processing', true)
    try {
      await this.write(ssid, BT_UUIDS.SSID)
      await this.write(password, BT_UUIDS.PASSWORD)
      console.log('WIFI WRITTEN', ssid, password)
      await this.write(password, BT_UUIDS.CONNECT)
      console.log('WIFI CONNECTED', ssid, password)
    } catch (error) {
      console.error('Error writing wifi', error)
      this.set('error', 'Error writing wifi')
    }
    this.set('processing', false)
  }

  async writeRegistrationCode(code: string) {
    if (!this.device) return
    this.set('processing', true)
    try {
      await this.write(code, BT_UUIDS.REGISTRATION_CODE)
      console.log('REGISTRATION CODE WRITTEN', code)
    } catch (error) {
      console.error('Error writing registration code', error)
      this.set('error', 'Error writing registration code')
    }
    this.set('processing', false)
  }

  async read(characteristic: string) {
    if (!this.device) return
    try {
      const value = await BleClient.read(this.device.deviceId, BT_UUIDS.SERVICE, characteristic)
      return JSON.parse(this.parse(value))
    } catch (error) {
      console.error('Error reading value', error)
      this.set('error', `Error reading value from ${characteristic}`)
    }
  }

  async readSSIDs() {
    let count: number | null = null
    let attempts = 0
    this.set('processing', true)

    while (count === null && attempts < 50) {
      const result = await this.read(BT_UUIDS.WIFI_LIST)
      console.log('FIND WIFI COUNT', result)
      if (typeof result === 'number') count = result
      attempts++
    }
    console.log('WIFI COUNT', count)

    if (count === null) {
      this.set('error', 'Failed to read wifi count')
      this.set('processing', false)
      return
    }

    const list: string[] = []
    for (let i = 0; i < count; i++) {
      const wifi = (await this.read(BT_UUIDS.WIFI_LIST)) || 'unknown'
      list.push(wifi.ssid)
    }
    console.log('WIFI LIST', list)
    this.set('processing', false)
    return list
  }

  // async status() {
  //   // incorrect!
  //   const result = await this.read(BT_UUIDS.CONNECT_STATUS)
  //   console.log('CONNECT STATUS', result)
  //   return result
  // }

  parse(data: DataView) {
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(data)
  }

  set = (key, value) => {
    this.state[key] = value
    this.emit('updated')
    console.log('updated', key, value, this.state)
  }
}

export default new Bluetooth()
