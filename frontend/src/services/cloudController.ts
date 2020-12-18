import io from 'socket.io-client'
import analyticsHelper from '../helpers/analyticsHelper'
import { WEBSOCKET_URL } from '../shared/constants'
import { emit } from './Controller'
import { getToken } from './remote.it'
import { store } from '../store'
import { selectService } from '../models/devices'
import { connectionName, setConnection } from '../helpers/connectionHelper'

function encode(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

class CloudController {
  async init() {
    console.log('CLOUD CONTROLLER INIT')

    const token = await getToken()
    console.log('BEARER TOKEN', token)

    let socket = new WebSocket(WEBSOCKET_URL)

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
                application
              }
            }
          }`,
          // actor {
          //   email
          // }
          // users {
          //   email
          // }
          // "variables": {}
        })
      )
    }

    // TO REQUEST:
    //    isDevice field on target

    socket.onmessage = response => {
      let event = this.parse(response)
      if (event) event = this.update(event)

      console.log('\n-------------------------> SOCKET MESSAGE\n\n', response.data, event)
      // {"data":{"event":{"type":"DEVICE_STATE","state":"active","timestamp":"2020-12-16T00:24:56.000Z","target":[{"id":"80:00:00:00:01:07:C2:36","name":"remoteit admin"}]}}}
      // {"data":{"event":{"type":"DEVICE_STATE","state":"inactive","timestamp":"2020-12-16T00:24:46.000Z","target":[{"id":"80:00:00:00:01:07:C2:3E","name":"chat04"}]}}}
      if (event) this.notify(event)
    }
  }

  parse(response): ICloudEvent | undefined {
    const state = store.getState()
    let event
    try {
      event = JSON.parse(response.data).data.event
      return {
        type: event.type,
        state: event.state,
        timestamp: new Date(event.timestamp),
        target: event.target.map(t => {
          const [service, device] = selectService(state, t.id)
          return {
            id: t.id,
            name: connectionName(service, device) || t.name,
            application: t.application,
            connection: state.backend.connections.find(c => c.id === t.id),
            service,
            device,
          }
        }),
      }
    } catch (error) {
      console.warn('Event parsing error', { event, error })
    }
  }

  update(event: ICloudEvent) {
    switch (event.type) {
      case 'DEVICE_STATE':
        // active | inactive
        const state = event.state === 'active' ? 'active' : 'inactive'
        event.target.forEach(target => {
          if (target.device?.id === target.id) {
            target.device.state = state
            console.log('DEVICE STATE', target.device.name, target.device.state)
          } else {
            target.device?.services.find(service => {
              if (service.id === target.service?.id) {
                service.state = state
                console.log('SERVICE STATE', service.name, service.state)
              }
            })
          }
        })
        break

      case 'DEVICE_CONNECT':
        // connected | disconnected
        event.target.forEach(target => {
          if (target.connection) {
            target.connection.active = event.state === 'connected'
            target.connection.connecting = false
          }
          console.log('CONNECTION STATE', target.connection?.name, target.connection?.active)
        })
        break

      case 'DEVICE_SHARE':
      // @TODO parse and display notice
    }
    return event
  }

  notify(event: ICloudEvent) {
    const { accounts } = store.dispatch

    event.title = 'remote.it notice'
    event.body = this.getMessage(event)

    switch (event.type) {
      case 'DEVICE_STATE':
        event.target.forEach(target => {
          if (target.device) accounts.setDevice({ id: target.device.id, device: target.device })
          // if (target.application === ) new Notification(event.title || '', { body: event.body })
        })
        break

      case 'DEVICE_CONNECT':
        event.target.forEach(target => {
          new Notification(event.title || '', { body: event.body })
          if (target.connection) setConnection(target.connection)
        })
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
