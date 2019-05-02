import { connect } from 'react-redux'
import { IService } from 'remote.it'
import { ConnectButton } from '../../components/ConnectButton'

export type ConnectButtonControllerProps = { service: IService } & ReturnType<
  typeof mapDispatch
>

const mapDispatch = (dispatch: any) => ({
  connect: dispatch.devices.connect,
})

export const ConnectButtonController = connect(
  null,
  mapDispatch
)(ConnectButton)
