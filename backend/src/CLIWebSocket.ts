import WebSocket from 'ws'

type ICallback = (payload: IPayload) => void

export default class CLIWebSocket {
  onConnect?: ICallback
  onClose?: ICallback
  onError?: ICallback
  onDataReceived?: ICallback
  private _ws: any
  private _url: string
  private _reconnect: boolean = true
  private _delayInMsBeforeReconnect: number = 1000
  private _onMessageReceived: { [key: string]: ICallback } = {}

  constructor(url: string) {
    this._url = url
    this.setUpConnection()
  }

  public send(type: string, data: any) {
    console.log('--------------')
    console.trace()
    console.log('--------------')
    console.log('type', type)
    console.log('--------------')
    console.log('data', data)
    console.log('--------------')
    const dataAsString = JSON.stringify({
      Type: type,
      Data: data,
    })

    this._ws.send(dataAsString)
  }

  public on(type: string, callback: ICallback) {
    this._onMessageReceived[type] = callback
  }

  private setUpConnection() {
    this._ws = new WebSocket(this._url)

    this._ws.onclose = (event: any) => {
      const response = JSON.parse(event.data)

      if (typeof this.onClose === 'function') {
        this.onClose(response)
      }

      if (this._reconnect) {
        setTimeout(() => this.setUpConnection, this._delayInMsBeforeReconnect)
      }
    }

    this._ws.onopen = (response: any) => {
      if (typeof this.onConnect === 'function') {
        this.onConnect(response)
      }
    }

    // WHEN data received, then de-serialize and pass up the chain
    this._ws.onmessage = (event: any) => {
      const response = JSON.parse(event.data)

      if (typeof this.onDataReceived === 'function') {
        this.onDataReceived(response)
      }

      if (typeof this._onMessageReceived[response.type] === 'function') {
        this._onMessageReceived[response.type](response)
      }
    }

    // IF errors just notify
    this._ws.onerror = (event: any) => {
      const response = JSON.parse(event.data)

      if (typeof this.onError === 'function') {
        this.onError(response)
      }
    }
  }
}
