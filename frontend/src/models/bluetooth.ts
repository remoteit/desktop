import browser from '../services/browser'
import { createModel } from '@rematch/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { RootModel } from '.'
import { BT_UUIDS } from '../constants'
import { emit } from '../services/Controller'

interface DeviceInfo {
  deviceId: string
  name?: string
}

interface NetworkInfo {
  ssid: string
  signal: number
}

interface Notification {
  ssid?: string
  wifi?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'FAILED_START' | 'INVALID_PASSWORD' | 'INVALID_SSID'
  scan?: 'SCANNING' | 'COMPLETE'
  reg?: 'UNREGISTERED' | 'REGISTERING' | 'REGISTERED'
  id?: string // device id if registered
}

const CHARACTERISTIC_NAMES = {
  [BT_UUIDS.SERVICE]: 'Service',
  [BT_UUIDS.CONNECT]: 'Connect',
  [BT_UUIDS.SCAN_WIFI]: 'Scan Wifi',
  [BT_UUIDS.WIFI_LENGTH]: 'Wifi Length',
  [BT_UUIDS.WIFI_LIST]: 'Wifi List',
  [BT_UUIDS.WIFI_STATUS]: 'Wifi Status',
  [BT_UUIDS.REGISTRATION_CODE]: 'Registration Code',
  [BT_UUIDS.REGISTRATION_STATUS]: 'Registration Status',
}

export interface BluetoothState extends Notification {
  device?: DeviceInfo
  notify: Set<string>
  initialized: boolean
  processing: boolean
  connected: boolean // bluetooth connected
  networks: NetworkInfo[]
  message: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

const defaultState: BluetoothState = {
  notify: new Set<string>(),
  initialized: false,
  processing: false,
  connected: false,
  networks: [],
  message: '',
}

const SCAN_TIMEOUT = 30000

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async start() {
      await dispatch.bluetooth.initialize()
      if (browser.isAndroid) await dispatch.bluetooth.disconnect()
      await dispatch.bluetooth.connect()
      await dispatch.bluetooth.startNotifications()
    },

    async initialize() {
      let scanTimer: NodeJS.Timeout | undefined

      try {
        console.log('BLUETOOTH INITIALIZING')
        await dispatch.bluetooth.set({ message: '', processing: true })
        await BleClient.initialize({ androidNeverForLocation: true })

        scanTimer = setTimeout(async () => {
          clearTimeout(scanTimer)
          scanTimer = undefined
          await dispatch.bluetooth.cancel()
        }, SCAN_TIMEOUT)

        const device = await BleClient.requestDevice({ services: [BT_UUIDS.SERVICE] })
        console.log('BLUETOOTH DEVICE', device)
        clearTimeout(scanTimer)

        await dispatch.bluetooth.set({
          device,
          initialized: true,
        })
      } catch (error) {
        console.error('BLUETOOTH INITIALIZATION ERROR', error, error.message)

        await dispatch.bluetooth.stop()
        if (scanTimer) {
          clearTimeout(scanTimer)
          await dispatch.bluetooth.set({ message: 'Bluetooth scan canceled', severity: 'info' })
        } else {
          await dispatch.bluetooth.set({ message: 'Bluetooth scan timed out', severity: 'warning' })
        }
      }
    },

    async stop(_: void, state) {
      await dispatch.bluetooth.stopNotifications()
      await dispatch.bluetooth.disconnect()
      await dispatch.bluetooth.reset()
    },

    async cancel(_: void) {
      emit('cancelBluetooth')
    },

    async connect(_: void, state) {
      const { device, connected } = state.bluetooth
      const set = dispatch.bluetooth.set

      if (!device) {
        console.log('NO DEVICE TO CONNECT TO', device)
        return
      }

      if (connected) {
        console.log('ALREADY CONNECTED')
        return
      }

      try {
        await set({ message: '', processing: true })

        await BleClient.connect(device.deviceId, async deviceId => {
          console.log('BLUETOOTH DISCONNECTED', deviceId)
          await set({ message: 'Bluetooth disconnected', severity: 'warning', connected: false })
        })

        const services = await BleClient.getServices(device.deviceId)
        if (services.length) {
          await set({ connected: true, processing: false })
          console.log('BLUETOOTH SERVICES', services)
        } else {
          console.log('NO SERVICES FOUND')
        }
      } catch (error) {
        console.error('ERROR processing TO DEVICE', error)
        await set({
          message: `Failed to connect to device: ${error.message}`,
          severity: 'error',
          connected: false,
          processing: false,
        })
      }
    },

    async disconnect(_: void, state) {
      if (!state.bluetooth.device) return
      try {
        await BleClient.disconnect(state.bluetooth.device.deviceId)
      } catch (error) {
        console.error('ERROR DISCONNECTING', error)
      }
    },

    async reconnect(_: void) {
      await dispatch.bluetooth.disconnect()
      await dispatch.bluetooth.connect()
    },

    async notify(characteristic: string, state) {
      const notify = new Set(state.bluetooth.notify)
      const device = state.bluetooth.device
      if (!device) return
      try {
        if (notify.has(characteristic)) await dispatch.bluetooth.stopNotify(characteristic)
        notify.add(characteristic)
        console.log('NOTIFY ON', characteristic)
        await BleClient.startNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic, async value => {
          const result: Notification = parse(value)
          console.log('NOTIFICATION', characteristic, result)

          switch (result.wifi) {
            case 'FAILED_START':
            case 'INVALID_SSID':
              await dispatch.bluetooth.set({ message: 'Invalid Network SSID', severity: 'error' })
              break
            case 'INVALID_PASSWORD':
              await dispatch.bluetooth.set({ message: 'Invalid Password', severity: 'error' })
              break
          }

          await dispatch.bluetooth.set({ ...result })
        })
      } catch (error) {
        console.error('NOTIFY ERROR', error)
      }
      await dispatch.bluetooth.set({ notify })
    },

    async stopNotify(characteristic: string, state) {
      const notify = new Set(state.bluetooth.notify)
      const device = state.bluetooth.device
      if (!device) return
      try {
        console.log('STOP NOTIFY', characteristic)
        await BleClient.stopNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic)
        notify.delete(characteristic)
        await dispatch.bluetooth.set({ notify })
      } catch (error) {
        console.error('STOP NOTIFY ERROR', error)
      }
    },

    async startNotifications(_: void) {
      const characteristics = [BT_UUIDS.WIFI_STATUS, BT_UUIDS.REGISTRATION_STATUS]
      for (const characteristic of characteristics) {
        await dispatch.bluetooth.notify(characteristic)
        const result = await dispatch.bluetooth.read(characteristic)
        console.log('READ', CHARACTERISTIC_NAMES[characteristic], result)
        await dispatch.bluetooth.set(result)
      }
    },

    async stopNotifications(_: void) {
      const characteristics = [BT_UUIDS.WIFI_STATUS, BT_UUIDS.REGISTRATION_STATUS]
      for (const characteristic of characteristics) {
        await dispatch.bluetooth.stopNotify(characteristic)
      }
    },

    async write({ value, characteristic }: { value: string; characteristic: string }, state) {
      const device = state.bluetooth.device
      if (!device) return
      try {
        const buffer = new TextEncoder().encode(value)
        const data = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        console.log('WRITING', device.deviceId, characteristic, value, data)
        await BleClient.write(device.deviceId, BT_UUIDS.SERVICE, characteristic, data)
        console.log('WRITE SUCCESSFUL', characteristic, value, data)
      } catch (error) {
        console.error(`ERROR WRITING VALUE ${value} to ${CHARACTERISTIC_NAMES[characteristic]}`, error)
      }
    },

    async writeWifi({ ssid, pwd }: { ssid: string; pwd: string }, state) {
      const { set, write } = dispatch.bluetooth
      const device = state.bluetooth.device
      if (!device) return
      await set({ processing: true, message: '' })
      try {
        await write({ value: JSON.stringify({ ssid, pwd }), characteristic: BT_UUIDS.CONNECT })
        console.log('WIFI WRITTEN', ssid, pwd)
      } catch (error) {
        await set({ message: `Could not set WiFi: ${error.message}`, severity: 'error' })
        console.error('ERROR WRITING WIFI', error)
      }
      await set({ processing: false })
    },

    async writeRegistrationCode(code: string, state) {
      const device = state.bluetooth.device
      if (!device) return
      await dispatch.bluetooth.set({ processing: true })
      try {
        await await dispatch.bluetooth.write({ value: code, characteristic: BT_UUIDS.REGISTRATION_CODE })
        console.log('REGISTRATION CODE WRITTEN', code)
      } catch (error) {
        await dispatch.bluetooth.set({ message: `Could not register this device: ${error.message}`, severity: 'error' })
        console.error('ERROR WRITING REGISTRATION CODE', error)
      }
      await dispatch.bluetooth.set({ processing: false })
    },

    async scanSSIDs(_: void, state) {
      const device = state.bluetooth.device
      if (!device) return

      try {
        console.log('SCANNING NETWORKS')
        await dispatch.bluetooth.set({ message: '', scan: 'SCANNING' })
        await dispatch.bluetooth.read(BT_UUIDS.SCAN_WIFI)
      } catch (error) {
        console.error('Error scanning SSIDs', error)
        await dispatch.bluetooth.set({ message: `Unable to scan for WiFi: ${error.message}`, severity: 'error' })
      }
    },

    async read(characteristic: string, state) {
      const device = state.bluetooth.device
      if (!device) return
      try {
        console.log('READING', CHARACTERISTIC_NAMES[characteristic])
        const value = await BleClient.read(device.deviceId, BT_UUIDS.SERVICE, characteristic, { timeout: 10000 })
        return parse(value)
      } catch (error) {
        await dispatch.bluetooth.set({
          message: `Failed to read ${CHARACTERISTIC_NAMES[characteristic]}: ${error.message}`,
          severity: 'error',
        })
        console.error(`ERROR READING VALUE ${CHARACTERISTIC_NAMES[characteristic]}`, error.message, error.code, error)
      }
    },

    async readSSIDs() {
      await dispatch.bluetooth.set({ processing: true })
      const count = await dispatch.bluetooth.read(BT_UUIDS.WIFI_LENGTH)

      if (!count) {
        await dispatch.bluetooth.set({ message: 'Failed to read device WiFi', severity: 'error', processing: false })
        return
      }

      const networks: NetworkInfo[] = []
      for (let i = 0; i < count; i++) {
        const wifi: NetworkInfo = (await dispatch.bluetooth.read(BT_UUIDS.WIFI_LIST)) || {
          ssid: 'unknown',
          signal: -100,
        }
        networks.push(wifi)
      }

      console.log('WIFI LIST', networks)
      await dispatch.bluetooth.set({ networks, processing: false })
    },
  }),
  reducers: {
    reset(state: BluetoothState) {
      state = { ...defaultState }
      return state
    },
    set(state: BluetoothState, params: Partial<BluetoothState>) {
      if (!params) return state
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

function parse(data: DataView) {
  const decoder = new TextDecoder('utf-8')
  const json = decoder.decode(data)
  try {
    return JSON.parse(json)
  } catch (error) {
    return json
  }
}
