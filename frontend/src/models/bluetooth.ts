import browser from '../services/browser'
import { createModel } from '@rematch/core'
import { BleClient, textToDataView } from '@capacitor-community/bluetooth-le'
import { RootModel } from '.'
import { BT_UUIDS } from '../constants'
import { emit } from '../services/Controller'
import { off } from 'process'

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
          buffers: {},
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

      // Define the markers
      const START_MARKER = "[START]"
      const END_MARKER = "[END]"

      try {
        if (notify.has(characteristic)) await dispatch.bluetooth.stopNotify(characteristic)
        notify.add(characteristic)
        console.log('NOTIFY ON', characteristic)

        await BleClient.startNotifications(device.deviceId, BT_UUIDS.SERVICE, characteristic, async value => {
          try {

            // Ensure state.bluetooth.buffers exists and is mutable
            const buffers = { ...state.bluetooth.buffers }

            const decoder = new TextDecoder('utf-8')
            let chunk = decoder.decode(value)
            console.log('NOTIFICATION CHUNK', characteristic, chunk)

            if (chunk.includes(START_MARKER)) {
              console.log('START MARKER FOUND', characteristic)
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
              console.log('COMPLETE NOTIFICATION', characteristic, result)
              // Remove key from buffers
              delete buffers[characteristic]
              dispatch.bluetooth.set({ buffers })

              switch (result.wlan) {
                case 'FAILED_START':
                case 'INVALID_SSID':
                  dispatch.bluetooth.set({ message: 'Invalid Network SSID', severity: 'error' })
                  break
                case 'INVALID_PASSWORD':
                  dispatch.bluetooth.set({ message: 'Invalid Password', severity: 'error' })
                  break
              }

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

      const MTU = 248; // Maximum Transmission Unit size in bytes
      const START_MARKER = "[START]"
      const END_MARKER = "[END]"
      let offset = 0;

      console.log('WRITING', value, characteristic)

      while (offset < value.length) {

        let chunk = ''
        if (offset === 0) {
          chunk = START_MARKER
        }

        if (chunk.length < MTU) {
          const remaining = MTU - chunk.length;
          chunk += value.substring(offset, offset + remaining)
          offset += remaining
        }

        if (offset >= value.length) {
          const remaining = MTU - chunk.length
          if (remaining > END_MARKER.length) {
            chunk += END_MARKER
          }
        }
        console.log('CHUNK', chunk)

        await BleClient.write(
          device.deviceId,
          BT_UUIDS.SERVICE,
          characteristic,
          textToDataView(chunk)
        )
      }
    },

    async writeWifi({ ssid, pwd }: { ssid: string; pwd: string }, state) {
      const { set, write } = dispatch.bluetooth
      const device = state.bluetooth.device
      if (!device) return
      await set({ processing: true, message: '' })
      try {
        await write({ value: JSON.stringify({ command: "WIFI_CONNECT", ssid, password: pwd }), characteristic: BT_UUIDS.COMMAND })
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
        await dispatch.bluetooth.write({ value: JSON.stringify({ command: "R3_REGISTER", code }), characteristic: BT_UUIDS.COMMAND })
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
        const command = { command: 'WIFI_SCAN' }
        await dispatch.bluetooth.write({ value: JSON.stringify(command), characteristic: BT_UUIDS.COMMAND })
      } catch (error) {
        console.error('Error scanning SSIDs', error)
        await dispatch.bluetooth.set({ message: `Unable to scan for WiFi: ${error.message}`, severity: 'error' })
      }
    },

    async read(characteristic: string, state) {
      const device = state.bluetooth.device;
      if (!device) return;

      const START_MARKER = "[START]"
      const END_MARKER = "[END]"
      let completeData = ''
      let reading = true
      let count = 0

      try {
        console.log('READING', CHARACTERISTIC_NAMES[characteristic])

        while (reading) {
          const value = await BleClient.read(device.deviceId, BT_UUIDS.SERVICE, characteristic, { timeout: 10000 });
          const decoder = new TextDecoder('utf-8')
          let data = decoder.decode(value);

          console.log('CHUNK RECEIVED', data)

          if (data.includes(START_MARKER)) {
            if (count > 0) {
              throw new Error('START_MARKER found after the first read.');
            }
            data = data.replace(START_MARKER, '')
          }

          if (data.includes(END_MARKER)) {
            // Remove the END_MARKER from the data
            data = data.replace(END_MARKER, '')
            reading = false;
          }
          completeData += data
          count++
        }

        console.log('COMPLETE DATA RECEIVED', completeData);

        // Parse the complete data
        try {
          return JSON.parse(completeData);
        } catch (error) {
          throw new Error('Failed to parse JSON data.');
        }
      } catch (error) {
        dispatch.bluetooth.set({
          message: `Failed to read ${CHARACTERISTIC_NAMES[characteristic]}: ${error.message}`,
          severity: 'error',
        });
        console.error(`ERROR READING VALUE ${CHARACTERISTIC_NAMES[characteristic]}`, error.message, error.code, error);
      }
    },

    async readSSIDs() {
      await dispatch.bluetooth.set({ processing: true })

      const networks: NetworkInfo[] = []
      const networks_list = await dispatch.bluetooth.read(BT_UUIDS.WIFI_LIST)
      // Load the networks into the networks array
      if (networks_list) {
        networks_list.forEach((network: NetworkInfo) => {
          networks.push(network)
        })
      }

      console.log('WIFI LIST', networks)
      dispatch.bluetooth.set({ networks, processing: false })
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
