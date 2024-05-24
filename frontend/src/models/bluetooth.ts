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
  error: string
}

const defaultState: BluetoothState = {
  notify: new Set<string>(),
  initialized: false,
  processing: false,
  connected: false,
  networks: [],
  error: '',
}

const SCAN_TIMEOUT = 30000

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async start() {
      await dispatch.bluetooth.initialize()
      await dispatch.bluetooth.connect()
      await dispatch.bluetooth.startNotifications()
    },

    async initialize() {
      let scanTimer: NodeJS.Timeout | undefined

      try {
        console.log('BLUETOOTH INITIALIZING')
        await dispatch.bluetooth.set({ error: '', processing: true })
        await BleClient.initialize()

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
        console.error('BLUETOOTH INITIALIZATION ERROR:')
        console.error(error.message, error.code)
        await dispatch.bluetooth.stop()
        if (scanTimer) {
          clearTimeout(scanTimer)
          await dispatch.bluetooth.set({ error: 'Bluetooth scan canceled' })
        } else {
          await dispatch.bluetooth.set({ error: 'Bluetooth scan timed out' })
        }
      }
    },

    async stop(_: void, state) {
      await dispatch.bluetooth.stopNotifications()
      if (state.bluetooth.device) await BleClient.disconnect(state.bluetooth.device.deviceId)
      await dispatch.bluetooth.reset()
    },

    async cancel(_: void) {
      emit('cancelBluetooth')
    },

    async connect(_: void, state) {
      const device = state.bluetooth.device
      const set = dispatch.bluetooth.set

      if (!device) {
        console.log('NO DEVICE TO CONNECT TO', device)
        return
      }
      try {
        set({ error: '', processing: true })
        await BleClient.connect(device.deviceId)
        await BleClient.getServices(device.deviceId).then(services => {
          if (services.length) {
            set({ connected: true, processing: false })
            console.log('BLUETOOTH SERVICES', services)
          } else console.log('NO SERVICES FOUND')
        })
      } catch (error) {
        console.error('ERROR processing TO DEVICE', error)
        set({ error: 'Failed to connect to device', connected: false, processing: false })
      }
    },

    async reconnect(_: void, state) {
      const device = state.bluetooth.device
      if (device) await BleClient.disconnect(device.deviceId)
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
        await BleClient.startNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic, value => {
          const result: Notification = parse(value)
          console.log('NOTIFICATION', characteristic, result)

          switch (result.wifi) {
            case 'FAILED_START':
            case 'INVALID_SSID':
              dispatch.bluetooth.set({ error: 'Invalid Network SSID' })
              break
            case 'INVALID_PASSWORD':
              dispatch.bluetooth.set({ error: 'Invalid Password' })
              break
          }

          dispatch.bluetooth.set({ ...result })
        })
      } catch (error) {
        console.error('NOTIFY ERROR', error)
      }
      dispatch.bluetooth.set({ notify })
    },

    async stopNotify(characteristic: string, state) {
      const notify = new Set(state.bluetooth.notify)
      const device = state.bluetooth.device
      if (!device) return
      try {
        console.log('STOP NOTIFY', characteristic)
        await BleClient.stopNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic)
        notify.delete(characteristic)
        dispatch.bluetooth.set({ notify })
      } catch (error) {
        console.error('STOP NOTIFY ERROR', error)
      }
    },

    async startNotifications(_: void) {
      const characteristics = [BT_UUIDS.WIFI_STATUS, BT_UUIDS.REGISTRATION_STATUS]
      for (const characteristic of characteristics) {
        await dispatch.bluetooth.notify(characteristic)
        await dispatch.bluetooth.read(characteristic)
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
      set({ processing: true, error: '' })
      try {
        await write({ value: JSON.stringify({ ssid, pwd }), characteristic: BT_UUIDS.CONNECT })
        console.log('WIFI WRITTEN', ssid, pwd)
      } catch (error) {
        set({ error: 'Error setting WiFi' })
        console.error('ERROR WRITING WIFI', error)
      }
      set({ processing: false })
    },

    async writeRegistrationCode(code: string, state) {
      const device = state.bluetooth.device
      if (!device) return
      dispatch.bluetooth.set({ processing: true })
      try {
        await dispatch.bluetooth.write({ value: code, characteristic: BT_UUIDS.REGISTRATION_CODE })
        console.log('REGISTRATION CODE WRITTEN', code)
      } catch (error) {
        console.error('Error writing registration code', error)
        dispatch.bluetooth.set({ error: 'Error setting registration code' })
      }
      dispatch.bluetooth.set({ processing: false })
    },

    async scanSSIDs(_: void, state) {
      const device = state.bluetooth.device
      if (!device) {
        dispatch.bluetooth.set({ error: 'No device to scan SSIDs' })
        return
      }
      try {
        dispatch.bluetooth.set({ error: '' })
        await dispatch.bluetooth.read(BT_UUIDS.SCAN_WIFI)
        console.log('SCANNING SSIDs')
      } catch (error) {
        console.error('Error scanning SSIDs', error)
        dispatch.bluetooth.set({ error: 'Error scanning SSIDs' })
      }
    },

    async read(characteristic: string, state) {
      const device = state.bluetooth.device
      if (!device) return
      try {
        const value = await BleClient.read(device.deviceId, BT_UUIDS.SERVICE, characteristic)
        return parse(value)
      } catch (error) {
        console.error(`ERROR READING VALUE ${CHARACTERISTIC_NAMES[characteristic]}`, error)
      }
    },

    async readWifiStatus() {
      dispatch.bluetooth.read(BT_UUIDS.WIFI_STATUS)
    },

    async readRegistrationStatus() {
      dispatch.bluetooth.read(BT_UUIDS.REGISTRATION_STATUS)
    },

    async readSSIDs() {
      dispatch.bluetooth.set({ processing: true })
      const count = await dispatch.bluetooth.read(BT_UUIDS.WIFI_LENGTH)

      if (count === null) {
        dispatch.bluetooth.set({ error: 'Failed to read device WiFi', processing: false })
        return
      }

      const networks: NetworkInfo[] = []
      for (let i = 0; i < count; i++) {
        const wifi = (await dispatch.bluetooth.read(BT_UUIDS.WIFI_LIST)) || 'unknown'
        networks.push(wifi)
      }

      console.log('WIFI LIST', networks)
      dispatch.bluetooth.set({ networks, processing: false })
    },

    // async status() {
    //   // incorrect!
    //   const result = await this.read(BT_UUIDS.CONNECT_STATUS)
    //   console.log('CONNECT STATUS', result)
    //   return result
    // }
  }),
  reducers: {
    reset(state: BluetoothState) {
      state = { ...defaultState }
      return state
    },
    set(state: BluetoothState, params: Partial<BluetoothState>) {
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
