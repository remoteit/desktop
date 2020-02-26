import server from './server'
import Logger from './Logger'
import EventBus from './EventBus'
import CLIWebSocket from './CLIWebSocket'
import { WEBSOCKET_URL } from './constants'

class CLIController {
  private socket: CLIWebSocket

  constructor() {
    Logger.info('START CLI CONTROLLER')
    this.socket = new CLIWebSocket(WEBSOCKET_URL)
    this.addHandlers()
    EventBus.on(server.EVENTS.authenticated, this.ready)
  }

  ready = () => {
    // this.socket.send('GetConnections', [])
  }

  send = (channel: string, data: object) => {
    this.socket.send(channel, data)
  }

  addHandlers = () => {
    this.socket.onConnect = () => console.log('onConnect')
    this.socket.onClose = () => console.log('onClose')
    this.socket.onError = () => console.warn('onError')

    this.socket.on('GetConnections', (response: IPayload) => {
      console.log('socket.on-GetConnections')
      if (response.hasError) {
        console.log('	error: ', response.errorMessage)
      } else {
        console.log('	data:', response.data)
      }
    })

    this.socket.on('SetConnections', (response: IPayload) => {
      console.log('socket.on-SetConnections')
      if (response.hasError) {
        console.log('	error: ', response.errorMessage)
      }
    })

    this.socket.on('GetAuth', (response: IPayload) => {
      console.log('socket.on-GetAuth')
      if (response.hasError) {
        console.log('	error: ', response.errorMessage)
      } else {
        console.log('	data:', response.data)
      }
    })

    this.socket.on('SetAuth', (response: IPayload) => {
      console.log('socket.on-SetAuth')
      if (response.hasError) {
        console.log('	error: ', response.errorMessage)
      }
    })

    this.socket.on('Forget', (response: IPayload) => {
      console.log('socket.on-Forget')
      if (response.hasError) {
        console.log('	error: ', response.errorMessage)
      } else {
        console.log('	data:', response.data)
      }
    })
  }
}

export default new CLIController()

/* 

ACTION EXAMPLES

function GetConnections() {
  var object = {}

  socket.Send('GetConnections', object)
}
function SetConnections() {
  var object = {
    connections: [
      {
        uid: '80:00:00:00:01:01:8E:EE',
        name: '',
        port: 25185,
        hostname: 'localhost',
        disabled: false,
        retry: true,
        failover: true,
        restart: false,
        createdTime: 0,
        owner: '',
        restriction: '',
        connected: false,
        connecting: false,
        error: {
          code: 0,
          errorMessage: '',
        },
        startTime: 0,
        stopTime: 0,
        metadata: null,
      },
    ],
  }

  socket.Send('SetConnections', object)
}

function GetAuth() {
  var object = {}

  socket.Send('GetAuth', object)
}
function SetAuth() {
  var object = {
    authHash:
      'hVYwtk/RhKZMDDFVf9SfIjNHCp9e/J+VHGHsXRP5Xeohd+5BHnEjI+MwBDEles+EUi/FF6ZNDki98eJu2D5ew1EtJ7pQc0hKNBqgJcqwEb4=',
    userName: 'nicolae@remote.it',
  }

  socket.Send('SetAuth', object)
}

function Forget() {
  var object = {
    uid: '80:00:00:00:01:01:8E:EE',
  }

  socket.Send('Forget', object)
}
 */
