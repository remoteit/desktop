import { DevicesPage } from '../../pages/DevicesPage'
import { ApplicationState, select } from '../../store'
import { connect } from 'react-redux'
import { IDevice } from 'remote.it'

// const visible = store.select.devices.visible
interface SelectResponse {
  visibleDevices: IDevice[]
}

// @ts-ignore
const visibleDevices: (state: any, props: any) => SelectResponse = select(
  (models: any): SelectResponse => ({
    visibleDevices: models.devices.visible,
  })
)

export type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState, props: any) => ({
  allDevices: state.devices.all,
  connections: state.devices.connections,
  // visibleDevices: state.devices.all,
  // visibleDevices: visible(state.devices.all),
  // ...store.select(models => ({
  //   visibleDevices: models.devices.visible,
  // })),
  ...visibleDevices(state, {}),
  fetching: state.devices.fetching,
  searchOnly: state.devices.searchOnly,
  user: state.auth.user,
})
const mapDispatch = (dispatch: any) => ({
  fetch: dispatch.devices.fetch,
  localSearch: dispatch.devices.localSearch,
  remoteSearch: dispatch.devices.remoteSearch,
  getConnections: dispatch.devices.getConnections,
})

export const DevicePageController = connect(
  mapState,
  mapDispatch
)(DevicesPage)
