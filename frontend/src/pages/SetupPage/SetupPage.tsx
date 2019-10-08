import React from 'react'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import BackendAdaptor from '../../services/BackendAdapter'
import { ITarget, IDevice } from '../../jump/common/types'
import Device from '../../jump/components/Device'

const socket: SocketIOClient.Socket = BackendAdaptor.socket

const mapState = (state: ApplicationState) => ({
  device: state.jump.device,
  targets: state.jump.targets,
  added: state.jump.added,
})

const mapDispatch = (dispatch: any) => ({
  setAdded: dispatch.jump.setAdded,
})

export type SetupPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const SetupPage = connect(
  mapState,
  mapDispatch
)(({ device, targets, added, setAdded }: SetupPageProps) => {
  const updateTargets = (t: ITarget[]) => socket.emit('jump/targets', t)
  const updateDevice = (d: IDevice) => socket.emit('jump/device', d)
  const deleteDevice = () => {
    socket.emit('jump/device', 'DELETE')
    socket.emit('jump/auth')
  }

  return (
    <Device
      device={device}
      targets={targets}
      added={added}
      onDevice={updateDevice}
      onUpdate={updateTargets}
      onDelete={deleteDevice}
      onCancel={() => setAdded(undefined)}
    />
  )
})
