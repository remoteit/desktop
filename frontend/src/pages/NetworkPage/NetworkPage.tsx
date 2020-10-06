import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { OutOfBand } from '../../components/OutOfBand'
import { Network } from '../../components/Network'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'

export const NetworkPage: React.FC = () => {
  const { interfaces, targets, scanData, privateIP } = useSelector((state: ApplicationState) => ({
    interfaces: state.backend.interfaces,
    targets: state.backend.targets,
    scanData: state.backend.scanData,
    privateIP: state.backend.environment.privateIP,
  }))
  const scan = (interfaceName: string) => {
    analyticsHelper.track('networkScan')
    emit('scan', interfaceName)
  }

  useEffect(() => {
    emit('interfaces')
  }, [])

  useEffect(() => {
    analyticsHelper.page('NetworkPage')
  }, [])

  return (
    <>
      <OutOfBand />
      <Network data={scanData} targets={targets} interfaces={interfaces} onScan={scan} privateIP={privateIP} />
    </>
  )
}
