import io from 'socket.io-client'
import analyticsHelper from '../helpers/analyticsHelper'
import { EventEmitter } from 'events'
import { getToken } from '../services/remote.it'
import { store } from '../store'

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
      console.log('\n-------------------------> SOCKET OPEN\n\n', event)
      socket.send(
        JSON.stringify({
          action: 'subscribe',
          headers: { authorization: token },
          query: `
          {
            event {
              type
              timestamp
              target {
                id
                name
              }
              state
            }
          }`,
          // "variables": {}
        })
      )
    }

    socket.onmessage = response => {
      console.log('\n-------------------------> SOCKET MESSAGE\n\n', response.data)
      // const example = {
      //   type: 'DEVICE_CONNECT',
      //   timestamp: '2020-12-13T18:12:01.000Z',
      //   target: [{ id: '80:00:00:00:01:04:02:B2', name: 'AWS admin panel' }],
      //   state: 'disconnected',
      // }
      const event = this.parse(response)
      if (event) this.notify(event)
    }
  }

  parse(response): ICloudEvent | undefined {
    let event
    try {
      event = JSON.parse(response.data).data.event
      return {
        type: event.type,
        state: event.state,
        timestamp: new Date(event.timestamp),
        target: event.target || [],
      }
    } catch (error) {
      console.warn('Event parsing error', { event, error })
    }
  }

  notify(event: ICloudEvent) {
    switch (event.type) {
      case 'DEVICE_STATE':
        // new Notification('To do list', { body: text, icon: img });
        new Notification(`Device ${event.type}`, { body: event.state })
      case 'DEVICE_CONNECT':
      case 'DEVICE_SHARE':
    }
    store.dispatch.ui.set({ noticeMessage: `Device ${event.type} went ${event.state}` })
  }
}

const cloudController = new CloudController()
export default cloudController
