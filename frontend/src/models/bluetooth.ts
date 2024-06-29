import browser from '../services/browser'
import { createModel } from '@rematch/core'
import { BleClient, textToDataView } from '@capacitor-community/bluetooth-le'
import { RootModel } from '.'
import { BT_UUIDS } from '../constants'
import { emit } from '../services/Controller'
import event from '../services/event'

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
  wlan?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'FAILED_START' | 'INVALID_PASSWORD' | 'INVALID_SSID'
  eth?: 'CONNECTED' | 'DISCONNECTED'
  scan?: 'SCANNING' | 'COMPLETE'
  reg?: 'UNREGISTERED' | 'REGISTERING' | 'REGISTERED'
  id?: string // device id if registered
}

const CHARACTERISTIC_NAMES = {
  [BT_UUIDS.SERVICE]: 'Service',
  [BT_UUIDS.COMMAND]: 'Command',
  [BT_UUIDS.WIFI_LIST]: 'WiFi List',
  [BT_UUIDS.WIFI_STATUS]: 'WiFi Status',
  [BT_UUIDS.REGISTRATION_STATUS]: 'Registration Status',
}

export interface BluetoothState extends Notification {
  device?: DeviceInfo
  buffers?: { [key: string]: string }
  notify: Set<string>
  initialized: boolean
  searching: boolean // scanning for devices
  connected: boolean // bluetooth connected
  networks: NetworkInfo[]
  message: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  eventAutoRegister: boolean
  eventRegistering: boolean
}

const defaultState: BluetoothState = {
  notify: new Set<string>(),
  initialized: false,
  searching: false,
  connected: false,
  networks: [],
  message: '',
  eventRegistering: false,
  eventAutoRegister: true,
}

// Buffer markers
const START_MARKER = '[START]'
const END_MARKER = '[END]'
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
        await dispatch.bluetooth.set({ message: '', searching: true })
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
          buffers: {},
        })
      } catch (error) {
        console.error('BLUETOOTH INITIALIZATION ERROR', { error, code: error.code, message: error.message })

        await dispatch.bluetooth.stop()
        if (scanTimer) {
          clearTimeout(scanTimer)
          await dispatch.bluetooth.set({ message: 'Bluetooth scan canceled', severity: 'info' })
        } else if (error.code === 'UNAVAILABLE') {
          await dispatch.bluetooth.set({
            message: 'Bluetooth is not available from this browser or device. Try Google Chrome.',
            severity: 'error',
          })
        } else {
          await dispatch.bluetooth.set({ message: 'No bluetooth devices found', severity: 'warning' })
        }
      }
    },

    async stop(_: void, state) {
      await dispatch.bluetooth.stopNotifications()
      await dispatch.bluetooth.disconnect()
      await dispatch.bluetooth.reset()
    },

    async cancel(_: void) {
      event('BLE_DEVICE_SCAN', { success: false })
      emit('cancelBluetooth')
    },

    async connect(_: void, state, ignoreConnected = false) {
      const { device, connected } = state.bluetooth
      const set = dispatch.bluetooth.set

      if (!device) {
        console.log('NO DEVICE TO CONNECT TO', device)
        return
      }

      if (connected && !ignoreConnected) {
        console.log('ALREADY CONNECTED')
        return
      }

      try {
        await set({ message: '', searching: true })

        await BleClient.connect(device.deviceId, async deviceId => {
          // Called on disconect
          console.log('BLUETOOTH DISCONNECTED', deviceId)
          // Set Connected false
          await set({ message: 'Bluetooth disconnected', severity: 'warning', connected: false, device: undefined })
        })

        const services = await BleClient.getServices(device.deviceId)
        if (services.length) {
          event('BLE_DEVICE_SCAN', { success: true })
          await set({ connected: true, searching: false })
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
          searching: false,
        })
      }
    },

    async disconnect(_: void, state) {
      if (!state.bluetooth.device) return
      try {
        console.log('DISCONNECTING')
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
        console.log('SETUP NOTIFY ON', characteristic)

        await BleClient.startNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic, async value => {
          try {
            // Ensure state.bluetooth.buffers exists and is mutable
            const buffers = { ...state.bluetooth.buffers }

            const decoder = new TextDecoder('utf-8')
            let chunk = decoder.decode(value)

            if (chunk.includes(START_MARKER)) {
              if (buffers[characteristic]) {
                throw new Error('Received unexpected [START] without [END]')
              }
              chunk = chunk.replace(START_MARKER, '')
              buffers[characteristic] = ''
            }

            if (chunk.includes(END_MARKER)) {
              if (buffers[characteristic] === undefined) {
                throw new Error('Received unexpected [END] without [START]')
              }

              chunk = chunk.replace(END_MARKER, '')
              buffers[characteristic] += chunk

              // Process the complete message
              const result: Notification = JSON.parse(buffers[characteristic])
              console.log('NOTIFY', CHARACTERISTIC_NAMES[characteristic], result)

              // Remove key from buffers
              delete buffers[characteristic]

              dispatch.bluetooth.set({ buffers })
              dispatch.bluetooth.notifyHandler(result)
              dispatch.bluetooth.set({ ...result })

              return
            } else {
              // Add the chunk to the buffer
              if (buffers[characteristic] === undefined) {
                throw new Error('Received chunk without [START]')
              }
              buffers[characteristic] += chunk
              dispatch.bluetooth.set({ buffers })
            }
          } catch (error) {
            console.error('NOTIFY ERROR', error)
            dispatch.bluetooth.set({ message: 'Notify Error: ' + error, severity: 'error' })
          }
        })
      } catch (error) {
        console.error('NOTIFY ERROR', error)
      }

      await dispatch.bluetooth.set({ notify })
    },

    async notifyHandler(result: Notification, state) {
      switch (result.reg) {
        case 'REGISTERING':
          dispatch.bluetooth.set({ eventRegistering: true })
          break
        case 'REGISTERED':
          if (state.bluetooth.eventRegistering)
            event('BLE_DEVICE_REGISTER', {
              success: true,
              deviceId: result.id,
              autoRegister: state.bluetooth.eventAutoRegister,
            })
          break
      }

      switch (result.wlan) {
        case 'FAILED_START':
        case 'INVALID_SSID':
          dispatch.bluetooth.set({ message: 'Invalid Network SSID', severity: 'error' })
          break
        case 'INVALID_PASSWORD':
          dispatch.bluetooth.set({ message: 'Invalid Password', severity: 'error' })
          break
        case 'CONNECTED':
          event('BLE_DEVICE_WIFI_CONNECT', { success: true })
          break
      }
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

      let connected = await this.isConnected()
      if (!connected) {
        // Try to connect
        await dispatch.bluetooth.connect()
        connected = await this.isConnected()

        if (!connected) {
          console.log('DEVICE DISCONNECTED setting status')
          await dispatch.bluetooth.set({ message: 'Device disconnected', severity: 'warning', connected: false })
          return
        }
      }

      const MTU = 248 // Maximum Transmission Unit size in bytes
      const START_MARKER = '[START]'
      const END_MARKER = '[END]'
      let offset = 0

      console.log('WRITING', value, characteristic)

      while (offset < value.length) {
        let chunk = ''
        if (offset === 0) {
          chunk = START_MARKER
        }

        if (chunk.length < MTU) {
          const remaining = MTU - chunk.length
          chunk += value.substring(offset, offset + remaining)
          offset += remaining
        }

        if (offset >= value.length) {
          const remaining = MTU - chunk.length
          if (remaining > END_MARKER.length) {
            chunk += END_MARKER
          }
        }

        await BleClient.write(device.deviceId, BT_UUIDS.SERVICE, characteristic, textToDataView(chunk))
      }
    },

    async isConnected(_: void, state) {
      if (!state.bluetooth.device) return false
      try {
        const services = await BleClient.getServices(state.bluetooth.device?.deviceId)
        return services.length > 0
      } catch (error) {
        return false
      }
    },

    async writeWifi({ ssid, pwd }: { ssid: string; pwd: string }, state) {
      const { set, write } = dispatch.bluetooth
      const device = state.bluetooth.device
      if (!device) return
      await set({ message: '', wlan: 'CONNECTING' })
      try {
        await write({
          value: JSON.stringify({ command: 'WIFI_CONNECT', ssid, password: pwd }),
          characteristic: BT_UUIDS.COMMAND,
        })
        console.log('WIFI WRITTEN', ssid, pwd)
      } catch (error) {
        event('BLE_DEVICE_WIFI_CONNECT', { success: false })
        await set({ message: `Could not set WiFi: ${error.message}`, severity: 'error', wlan: 'FAILED_START' })
        console.error('ERROR WRITING WIFI', error)
      }
    },

    async writeRegistrationCode(code: string, state) {
      const device = state.bluetooth.device
      if (!device) return
      await dispatch.bluetooth.set({ reg: 'REGISTERING', eventAutoRegister: false })
      try {
        await dispatch.bluetooth.write({
          value: JSON.stringify({ command: 'R3_REGISTER', code }),
          characteristic: BT_UUIDS.COMMAND,
        })
        console.log('REGISTRATION CODE WRITTEN', code)
      } catch (error) {
        await dispatch.bluetooth.set({ message: `Could not register this device: ${error.message}`, severity: 'error' })
        console.error('ERROR WRITING REGISTRATION CODE', error)
      }
    },

    async scanSSIDs(_: void, state) {
      const device = state.bluetooth.device
      if (!device) return

      try {
        console.log('SCANNING NETWORKS')
        await dispatch.bluetooth.set({ message: '', scan: 'SCANNING' })
        const command = { command: 'WIFI_SCAN' }
        await dispatch.bluetooth.write({ value: JSON.stringify(command), characteristic: BT_UUIDS.COMMAND })
      } catch (error) {
        console.error('Error scanning SSIDs', error)
        await dispatch.bluetooth.set({
          message: `Unable to scan for WiFi: ${error.message}`,
          severity: 'error',
          scan: 'COMPLETE',
        })
      }
    },

    async read(characteristic: string, state) {
      const device = state.bluetooth.device
      if (!device) return

      let connected = await this.isConnected()
      if (!connected) {
        // Try to connect
        await dispatch.bluetooth.connect()
        connected = await this.isConnected()

        if (!connected) {
          console.log('DEVICE DISCONNECTED setting status')
          await dispatch.bluetooth.set({ message: 'Device disconnected', severity: 'warning', connected: false })
          return
        }
      }

      const START_MARKER = '[START]'
      const END_MARKER = '[END]'

      let completeData = ''
      let reading = true
      let count = 0

      try {
        console.log('READING', CHARACTERISTIC_NAMES[characteristic])

        while (reading) {
          const value = await BleClient.read(device.deviceId, BT_UUIDS.SERVICE, characteristic, { timeout: 10000 })
          const decoder = new TextDecoder('utf-8')
          let data = decoder.decode(value)

          if (data.includes(START_MARKER)) {
            if (count > 0) {
              throw new Error('START_MARKER found after the first read.')
            }
            data = data.replace(START_MARKER, '')
          }

          if (data.includes(END_MARKER)) {
            // Remove the END_MARKER from the data
            data = data.replace(END_MARKER, '')
            reading = false
          }
          completeData += data
          count++
        }

        // Parse the complete data
        try {
          return JSON.parse(completeData)
        } catch (error) {
          throw new Error('Failed to parse JSON data.')
        }
      } catch (error) {
        dispatch.bluetooth.set({
          message: `Failed to read ${CHARACTERISTIC_NAMES[characteristic]}: ${error.message}`,
          severity: 'error',
        })
        console.error(`ERROR READING VALUE ${CHARACTERISTIC_NAMES[characteristic]}`, error.message, error.code, error)
      }
    },

    async readSSIDs(_: void, state) {
      if (!state.bluetooth.device) return
      await dispatch.bluetooth.set({ scan: 'SCANNING' })
      const networks: NetworkInfo[] = []
      const networks_list = await dispatch.bluetooth.read(BT_UUIDS.WIFI_LIST)
      // Load the networks into the networks array
      if (networks_list) {
        networks_list.forEach((network: NetworkInfo) => {
          networks.push(network)
        })
      }

      console.log('WIFI LIST', networks)
      event('BLE_DEVICE_WIFI_LIST', { count: networks.length })
      dispatch.bluetooth.set({ networks })
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
