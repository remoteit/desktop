import React, { useEffect } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { SetupView } from '../../components/SetupView'
import { Setup } from '../../components/Setup'
import { emit } from '../../services/Controller'

export const SetupPage: React.FC = () => {
  const { backend } = useDispatch<Dispatch>()
  const { nameBlacklist, device, targets, added, cliError } = useSelector((state: ApplicationState) => ({
    nameBlacklist: state.devices.all
      .filter(device => device.shared !== 'shared-from')
      .map(device => device.name.toLowerCase()),
    device: state.backend.device,
    targets: state.backend.targets,
    added: state.backend.added,
    cliError: state.backend.cliError,
  }))

  const { admin, guest, notElevated } = usePermissions()
  const setAdded = (value: any) => backend.set({ key: 'added', value })
  const updateTargets = (t: ITarget[]) => emit('targets', t)
  const updateDevice = (d: IDevice) => emit('device', d)
  const deleteDevice = () => {
    emit('device', 'DELETE')
  }

  useEffect(() => {
    // Refresh device data
    emit('device')
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
