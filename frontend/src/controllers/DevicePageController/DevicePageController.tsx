import { DevicesPage } from '../../components/DevicesPage'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'

export type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  devices: state.devices.all,
  fetching: state.devices.fetching,
  user: state.auth.user,
})
const mapDispatch = (dispatch: any) => ({
  fetch: dispatch.devices.fetch,
  getConnections: dispatch.devices.getConnections,
})

export const DevicePageController = connect(
  mapState,
  mapDispatch
)(DevicesPage)
