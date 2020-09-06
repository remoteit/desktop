import React, { useEffect } from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useHistory } from 'react-router-dom'
import { Typography } from '@material-ui/core'
import { UnregisterButton } from '../../buttons/UnregisterButton'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { Targets } from '../../components/Targets'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

type Props = {
  os?: Ios
  targets: ITarget[]
  targetDevice: ITargetDevice
}

export const SetupServices: React.FC<Props> = ({ targetDevice, os, targets, ...props }) => {
  const history = useHistory()

  useEffect(() => {
    emit('device') // Refresh device data
  }, [])

  if (!targetDevice.uid) {
    history.push('/settings/setupDevice')
  }

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="hdd" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>{targetDevice.name}</Title>
            <UnregisterButton targetDevice={targetDevice} />
          </Typography>
        </>
      }
      // footer={
      //   <>
      //     <Divider />
      //     <NetworkScanLocation />
      //   </>
      // }
    >
      <Typography variant="subtitle1">Services</Typography>
      <section>
        <Targets targetDevice={targetDevice} targets={targets} {...props} />
      </section>
    </Container>
  )
}
