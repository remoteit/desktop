import { connect } from 'react-redux'
import { IService } from 'remote.it'
import { ConnectButton } from '../../components/ConnectButton'
import { ApplicationState } from '../../store'

export type ConnectButtonControllerProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

const mapState = (
  state: ApplicationState,
  { service }: { service: IService }
) => ({
  service,
})

const mapDispatch = (dispatch: any) => ({
  connect: dispatch.devices.connect,
})

export const ConnectButtonController = connect(
  mapState,
  mapDispatch
)(ConnectButton)
