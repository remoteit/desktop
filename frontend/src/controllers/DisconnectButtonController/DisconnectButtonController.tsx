import { connect } from 'react-redux'
import { IService } from 'remote.it'
import { DisconnectButton } from '../../components/DisconnectButton'

export type DisconnectButtonControllerProps = {
  service: IService
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  disconnect: dispatch.devices.disconnect,
})

export const DisconnectButtonController = connect(
  null,
  mapDispatch
)(DisconnectButton)
