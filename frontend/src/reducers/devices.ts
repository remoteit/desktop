import produce from 'immer'
import { actions } from '../actions'
import { IDevice, IService } from 'remote.it'

export const initialState = {
  all: [] as IDevice[],
  fetched: false,
  fetching: false,
}

export const reducer = (store: typeof initialState, action: Action) => {
  return produce(store, draft => {
    switch (action.type) {
      case actions.devices.fetching:
        draft.fetched = false
        draft.fetching = true
        break
      case actions.devices.fetched:
        draft.all = action.devices
        draft.fetched = true
        draft.fetching = false
        break
      case actions.devices.connected:
        const service = action.service as IService

        // Find the device and set its state to "connected"
        const device = draft.all.find(d => d.id === service.deviceID)
        if (!device)
          throw new Error('Cannot find device with ID: ' + service.deviceID)
        device.state = 'connected'

        // Find the service and update its state.
        const s: IService | undefined = device.services.find(
          s => s.id === service.id
        )
        if (!s) throw new Error('Cannot find service with ID: ' + service.id)
        s.state = 'connected'
        // s.port = action.port as number
        break
    }
  })
}
