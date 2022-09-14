import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getOwnDevices } from '../models/accounts'
import { Typography } from '@mui/material'
import { OutOfBand } from '../components/OutOfBand'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Scan } from '../components/Scan'
import { emit } from '../services/Controller'

export const ScanPage: React.FC = () => {
  const { interfaces, services, scanData, privateIP } = useSelector((state: ApplicationState) => ({
    interfaces: state.backend.interfaces,
    services: getOwnDevices(state).find(d => d.thisDevice)?.services || [],
    scanData: state.backend.scanData,
    privateIP: state.backend.environment.privateIP,
  }))

  useEffect(() => {
    emit('interfaces')
  }, [])

  return (
    <Container
      integrated
      header={
        <>
          <OutOfBand />
          <Gutters>
            <Typography variant="h1" gutterBottom>
              Network Scan
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Scan your system and local network for available ports to host.
            </Typography>
          </Gutters>
        </>
      }
    >
      <Scan data={scanData} services={services} interfaces={interfaces} privateIP={privateIP} />
    </Container>
  )
}
