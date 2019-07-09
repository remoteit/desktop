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
  ...visibleDevices(state, {}),
  fetching: state.devices.fetching,
  query: state.devices.query,
  searchOnly: state.devices.searchOnly,
  user: state.auth.user,
  sort: state.devices.sort,
})
const mapDispatch = (dispatch: any) => ({
  fetch: dispatch.devices.fetch,
  localSearch: dispatch.devices.localSearch,
  remoteSearch: dispatch.devices.remoteSearch,
  changeSort: dispatch.devices.changeSort,
})

export const DevicePageController = connect(
  mapState,
  mapDispatch
)(DevicesPage)
