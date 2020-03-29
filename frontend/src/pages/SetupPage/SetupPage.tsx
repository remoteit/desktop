import React, { useEffect } from 'react'
import { isElectron } from '../../services/Browser'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { SetupView } from '../../components/SetupView'
import { Setup } from '../../components/Setup'
import Controller from '../../services/Controller'

export const SetupPage: React.FC = () => {
  const { backend } = useDispatch<Dispatch>()
  const setAdded = (value: any) => backend.set({ key: 'added', value })
  const { device, targets, added, admin, user, cliError, nameBlacklist, isElevated } = useSelector(
    (state: ApplicationState) => ({
      nameBlacklist: state.devices.all
        .filter(device => device.shared !== 'shared-from')
        .map(device => device.name.toLowerCase()),
      device: state.backend.device,
      targets: state.backend.targets,
      added: state.backend.added,
      admin: state.backend.admin,
      user: state.auth.user,
      cliError: state.backend.cliError,
      isElevated: state.backend.isElevated,
    })
  )

  const guest = admin && user && user.username !== admin
  const notElevated = !guest && !isElectron() && !isElevated

  const updateTargets = (t: ITarget[]) => Controller.emit('targets', t)
  const updateDevice = (d: IDevice) => Controller.emit('device', d)
  const deleteDevice = () => {
    Controller.emit('device', 'DELETE')
  }

  useEffect(() => {
    // Refresh device data
    Controller.emit('device')
  }, [])

  return guest || notElevated ? (
    <SetupView adminUser={admin} device={device} targets={targets} notElevated={notElevated} />
  ) : (
    <Setup
      device={device}
      targets={targets}
      added={added}
      cliError={cliError}
      nameBlacklist={nameBlacklist}
      onDevice={updateDevice}
      onUpdate={updateTargets}
      onDelete={deleteDevice}
      onCancel={() => setAdded(undefined)}
    />
  )
}
