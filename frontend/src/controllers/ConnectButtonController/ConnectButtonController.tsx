import { connect } from 'react-redux'
import { ConnectButton } from '../../components/ConnectButton'
import { IService } from 'remote.it'

const mapDispatch = (dispatch: any) => ({
  connect: dispatch.devices.connect,
})

export type ConnectButtonControllerProps = {
  service: IService
} & ReturnType<typeof mapDispatch>

export const ConnectButtonController = connect(
  null,
  mapDispatch
)(ConnectButton)
