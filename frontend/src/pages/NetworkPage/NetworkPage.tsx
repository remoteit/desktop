import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { OutOfBand } from '../../components/OutOfBand'
import { Scan } from '../../components/Scan'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
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

  useEffect(() => {
    emit('interfaces')
  }, [])

  useEffect(() => {
    analyticsHelper.page('NetworkPage')
  }, [])

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
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
      <Scan data={scanData} targets={targets} interfaces={interfaces} privateIP={privateIP} />
    </Container>
  )
}
