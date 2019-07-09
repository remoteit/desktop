import { connect } from 'react-redux'
import { DisconnectButton } from '../../components/DisconnectButton'

export type DisconnectButtonControllerProps = {
  id: string
  disabled?: boolean
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  disconnect: dispatch.devices.disconnect,
})

export const DisconnectButtonController = connect(
  null,
  mapDispatch
)(DisconnectButton)
