import io from 'socket.io-client'
import analyticsHelper from '../helpers/analyticsHelper'
import { EventEmitter } from 'events'
import { getToken } from '../services/remote.it'
import { store } from '../store'
import { selectService } from '../models/devices'
import { connectionName, setConnection } from '../helpers/connectionHelper'

function encode(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

class CloudController extends EventEmitter {
  async init() {
    console.log('CLOUD CONTROLLER INIT')

    const token = await getToken()
    console.log('BEARER TOKEN', token)

    let socket = new WebSocket('wss://ws.remote.it/beta')

    socket.onopen = event => {
      console.log('\n-------------------------> SOCKET OPEN\n\n')
      socket.send(
        JSON.stringify({
          action: 'subscribe',
          headers: { authorization: token },
          query: `
          {
            event {
              type
              state
              timestamp
              target {
                id
                name
              }
            }
          }`,
          // "variables": {}
        })
      )
    }

    socket.onmessage = response => {
      const event = this.parse(response)
      console.log('\n-------------------------> SOCKET MESSAGE\n\n', response.data, event)
      if (event) this.handleEvent(event)
    }
  }

  parse(response): ICloudEvent | undefined {
    const state = store.getState()
    let event
    try {
      event = JSON.parse(response.data).data.event
      return this.parseState({
        type: event.type,
        state: event.state,
        timestamp: new Date(event.timestamp),
        target: event.target.map(t => {
          const [service, device] = selectService(state, t.id)
          return {
            id: t.id,
            name: connectionName(service, device) || t.name,
            connection: state.backend.connections.find(c => c.id === t.id),
            service,
            device,
          }
        }),
      })
    } catch (error) {
      console.warn('Event parsing error', { event, error })
    }
  }

  parseState(event: ICloudEvent) {
    switch (event.type) {
      case 'DEVICE_STATE':
        // active | inactive
        const state = event.state === 'active' ? 'active' : 'inactive'
        event.target.forEach(target => {
          if (target.device?.id === target.id) {
            target.device.state = state
          } else {
            target.device?.services.find(service => {
              if (service.id === target.service?.id) {
                service.state = state
              }
            })
          }
        })
        break

      case 'DEVICE_CONNECT':
        // connected | disconnected
        event.target.forEach(target => {
          if (target.connection) target.connection.active = event.state === 'connected'
        })
        break

      case 'DEVICE_SHARE':
      // @TODO parse and display notice
    }
    return event
  }

  handleEvent(event: ICloudEvent) {
    const { accounts, ui } = store.dispatch
    switch (event.type) {
      case 'DEVICE_STATE':
        event.target.forEach(target => {
          if (target.connection) setConnection(target.connection)
        })
        ui.set({ noticeMessage: this.getMessage(event) })
        break

      case 'DEVICE_CONNECT':
        // new Notification('To do list', { body: text, icon: img });
        event.target.forEach(target => {
          accounts.setDevice({ id: target.id, device: target.device })
        })
        ui.set({ noticeMessage: this.getMessage(event) })
        break

      case 'DEVICE_SHARE':
      // @TODO parse and display notice
    }
  }

  getMessage(event: ICloudEvent) {
    const actions = {
      active: 'came online',
      inactive: 'went offline',
      connected: 'connected',
      disconnected: 'disconnected',
    }

    if (event.target.length > 1) {
      return `${event.target.map(t => t.name).join(', ')} ${actions[event.state]}`
    }

    return `${event.target[0].name} ${actions[event.state]}`
  }
}

const cloudController = new CloudController()
export default cloudController
