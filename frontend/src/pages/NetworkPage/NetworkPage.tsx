import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { getOwnDevices } from '../../models/accounts'
import { OutOfBand } from '../../components/OutOfBand'
import { Scan } from '../../components/Scan'
import { Container } from '../../components/Container'
import { Typography } from '@material-ui/core'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'

export const NetworkPage: React.FC = () => {
  const { interfaces, services, scanData, privateIP } = useSelector((state: ApplicationState) => ({
    interfaces: state.backend.interfaces,
    services: getOwnDevices(state).find(d => d.thisDevice)?.services || [],
    scanData: state.backend.scanData,
    privateIP: state.backend.environment.privateIP,
  }))

  useEffect(() => {
    emit('interfaces')
  }, [])

  useEffect(() => {
    analyticsHelper.page('NetworkPage')
  }, [])

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">Add from Network</Typography>
        </>
      }
    >
      <Scan data={scanData} services={services} interfaces={interfaces} privateIP={privateIP} />
    </Container>
  )
}
