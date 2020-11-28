import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { OutOfBand } from '../../components/OutOfBand'
import { Scan } from '../../components/Scan'
import { Container } from '../../components/Container'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography } from '@material-ui/core'
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
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">Add from Network</Typography>
        </>
      }
    >
      <Scan data={scanData} targets={targets} interfaces={interfaces} onScan={scan} privateIP={privateIP} />
    </Container>
  )
}
