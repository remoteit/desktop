import React, { useEffect } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { SetupView } from '../../components/SetupView'
import { Setup } from '../../components/Setup'
import { emit } from '../../services/Controller'
import Analytics from '../../helpers/Analytics'

export const SetupPage: React.FC = () => {
  const { backend } = useDispatch<Dispatch>()
  const { nameBlacklist, device, targets, added, cliError, hostname, os } = useSelector((state: ApplicationState) => ({
    nameBlacklist: state.devices.all
      .filter(device => device.shared !== 'shared-from')
      .map(device => device.name.toLowerCase()),
    device: state.backend.device,
    targets: state.backend.targets,
    added: state.backend.added,
    cliError: state.backend.cliError,
    hostname: state.backend.environment.hostname,
    os: state.backend.environment.os,
  }))

  const { admin, guest, notElevated } = usePermissions()
  const setAdded = (value: any) => backend.set({ key: 'added', value })
  const updateTargets = (t: ITarget[]) => {
    emit('targets', t)
  }
  const updateRegistration = (r: IRegistration) => {
    Analytics.Instance.track('deviceCreated', { deviceId: r.device.uid, deviceName: r.device.name })
    r.targets.forEach(target => {
      Analytics.Instance.track('serviceCreated', {
        serviceId: target.uid,
        serviceName: target.name,
        serviceType: target.type,
      })
    })
    emit('registration', r)
  }

  const deleteDevice = () => {
    Analytics.Instance.track('deviceRemoved', { deviceId: device.uid, deviceName: device.name })
    targets.forEach(target => {
      Analytics.Instance.track('serviceRemoved', {
        serviceId: target.uid,
        serviceName: target.name,
        serviceType: target.type,
      })
    })
    emit('device', 'DELETE')
  }

  useEffect(() => {
    // Refresh device data
    emit('device')
  }, [])

  useEffect(() => {
    Analytics.Instance.page('SetupPage')
  }, [])

  return guest || notElevated ? (
    <SetupView adminUser={admin} device={device} targets={targets} notElevated={notElevated} />
  ) : (
    <Setup
      os={os}
      device={device}
      targets={targets}
      added={added}
      cliError={cliError}
      hostname={hostname}
      nameBlacklist={nameBlacklist}
      onRegistration={updateRegistration}
      onUpdate={updateTargets}
      onDelete={deleteDevice}
      onCancel={() => setAdded(undefined)}
    />
  )
}
