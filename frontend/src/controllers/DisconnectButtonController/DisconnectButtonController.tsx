import { connect } from 'react-redux'
import { DisconnectButton } from '../../components/DisconnectButton'

const mapDispatch = (dispatch: any) => ({
  disconnect: dispatch.devices.disconnect,
})

export type DisconnectButtonControllerProps = {
  id: string
  disabled?: boolean
} & ReturnType<typeof mapDispatch>

export const DisconnectButtonController = connect(
  null,
  mapDispatch
)(DisconnectButton)
