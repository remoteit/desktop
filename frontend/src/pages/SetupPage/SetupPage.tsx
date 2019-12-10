import React from 'react'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import Controller from '../../services/Controller'
import Device from '../../components/jump/Device'

const mapState = (state: ApplicationState) => ({
  device: state.backend.device,
  targets: state.backend.targets,
  added: state.backend.added,
})

const mapDispatch = (dispatch: any) => ({
  setAdded: (value: any) => dispatch.backend.set({ key: 'added', value }),
})

export type SetupPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const SetupPage = connect(
  mapState,
  mapDispatch
)(({ device, targets, added, setAdded }: SetupPageProps) => {
  const updateTargets = (t: ITarget[]) => Controller.emit('targets', t)
  const updateDevice = (d: IDevice) => Controller.emit('device', d)
  const deleteDevice = () => {
    Controller.emit('device', 'DELETE')
    Controller.emit('init')
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
