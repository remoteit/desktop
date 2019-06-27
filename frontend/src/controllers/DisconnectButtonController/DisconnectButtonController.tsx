import { connect } from 'react-redux'
import { DisconnectButton } from '../../components/DisconnectButton'

export type DisconnectButtonControllerProps = {
  serviceID: string
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  disconnect: dispatch.devices.disconnect,
})

export const DisconnectButtonController = connect(
  null,
  mapDispatch
)(DisconnectButton)
