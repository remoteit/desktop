import { createModel } from '@rematch/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { RootModel } from '.'
import { BT_UUIDS } from '../constants'

interface DeviceInfo {
  deviceId: string
  name?: string
}

interface NetworkInfo {
  ssid: string
  signal: number
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

export interface BluetoothState {
  device?: DeviceInfo
  notify: Set<string>
  initialized: boolean
  processing: boolean
  connected: boolean // bluetooth connected
  networks: NetworkInfo[]
  error: string
  // notification statuses:
  wifi?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'FAILED_START' | 'INVALID_PASSWORD' | 'INVALID_SSID'
  ssid?: string
  scan?: 'SCANNING' | 'COMPLETE'
  reg?: 'UNREGISTERED' | 'REGISTERING' | 'REGISTERED'
  id?: string // device id if registered
}

const defaultState: BluetoothState = {
  notify: new Set<string>(),
  initialized: false,
  processing: false,
  connected: false,
  networks: [],
  error: '',
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async start() {
      await dispatch.bluetooth.initialize()
      await dispatch.bluetooth.connect()
      await dispatch.bluetooth.startNotifications()
    },

    async initialize() {
      try {
        await BleClient.initialize()
        console.log('BLUETOOTH INITIALIZING')
        dispatch.bluetooth.set({ error: '', processing: true })

        const device = await BleClient.requestDevice({ services: [BT_UUIDS.SERVICE] })
        dispatch.bluetooth.set({
          device,
          initialized: true,
          processing: false,
        })
      } catch (error) {
        dispatch.bluetooth.set({ error: 'Failed to initialize Bluetooth' })
        console.error('BLUETOOTH INITIALIZATION ERROR:', error)
      }
    },

    async clear(_: void, state) {
      const device = state.bluetooth.device
      if (device) await BleClient.disconnect(device.deviceId)
      dispatch.bluetooth.reset()
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
        console.log('NOTIFY', characteristic)
        await BleClient.startNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic, value => {
          console.log('NOTIFICATION', characteristic, parse(value))
          dispatch.bluetooth.set({ ...parse(value) })
        })
      } catch (error) {
        dispatch.bluetooth.set({ error: `Failed to start notification ${CHARACTERISTIC_NAMES[characteristic]}` })
        console.error('NOTIFY ERROR', error)
      }
      dispatch.bluetooth.set({ notify })
    },

    async stopNotify(characteristic: string, state) {
      const notify = new Set(state.bluetooth.notify)
      const device = state.bluetooth.device
      if (!device) return
      await BleClient.stopNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic)
      notify.delete(characteristic)
      dispatch.bluetooth.set({ notify })
      console.log('STOP NOTIFY', characteristic)
    },

    async startNotifications(_: void, state) {
      const characteristics = [BT_UUIDS.WIFI_STATUS, BT_UUIDS.REGISTRATION_STATUS]
      for (const characteristic of characteristics) {
        await dispatch.bluetooth.notify(characteristic)
        await dispatch.bluetooth.read(characteristic)
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
        dispatch.bluetooth.set({ error: `Error writing value ${value} to ${CHARACTERISTIC_NAMES[characteristic]}` })
        console.error('ERROR WRITING VALUE:', error)
      }
    },

    async writeWifi({ ssid, pwd }: { ssid: string; pwd: string }, state) {
      const { set, write } = dispatch.bluetooth
      const device = state.bluetooth.device
      if (!device) return
      set({ processing: true })
      try {
        await write({ value: JSON.stringify({ ssid, pwd }), characteristic: BT_UUIDS.CONNECT })
        console.log('WIFI WRITTEN', ssid, pwd)
      } catch (error) {
        set({ error: 'Error writing wifi' })
        console.error('Error writing wifi', error)
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
        dispatch.bluetooth.set({ error: 'Error writing registration code' })
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
        console.error('Error reading value', error)
        dispatch.bluetooth.set({ error: `Error reading value from ${CHARACTERISTIC_NAMES[characteristic]}` })
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
      console.log('WIFI COUNT', count)

      if (count === null) {
        dispatch.bluetooth.set({ error: 'Failed to read wifi count', processing: false })
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
