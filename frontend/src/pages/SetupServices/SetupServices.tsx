import React, { useEffect } from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { CircularProgress, Tooltip, IconButton, Typography, makeStyles } from '@material-ui/core'
import { NetworkScanLocation } from '../../components/NetworkScanLocation'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { Targets } from '../../components/Targets'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

type Props = {
  os?: Ios
  targets: ITarget[]
  targetDevice: ITargetDevice
}

export const SetupServices: React.FC<Props> = ({ targetDevice, os, targets, ...props }) => {
  const { setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))
  const { devices, ui } = useDispatch<Dispatch>()
  const confirmMessage = 'Are you sure?\nYou are about to permanently remove this device and all of its services.'
  const match = useRouteMatch()
  const history = useHistory()
  const css = useStyles()
  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => ui.set({ setupAdded: undefined })
  const onDelete = () => {
    ui.set({ setupDeletingDevice: true, setupBusy: true })
    analytics.track('deviceRemoved', { ...targetDevice, id: targetDevice.uid })
    targets.forEach(t => analytics.track('serviceRemoved', { ...t, id: t.uid }))
    emit('device', 'DELETE')
  }

  useEffect(() => {
    emit('device') // Refresh device data
  }, [])

  useEffect(() => {
    if (setupDeletingDevice && !targetDevice.uid) {
      devices.fetch() // @FIXME this will only run if the page is active
      if (match.path.includes('devices')) history.push(`/devices`)
      else history.push('/settings/setupDevice')
    }
  }, [targetDevice, devices, setupDeletingDevice, history])

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="hdd" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>{targetDevice.name}</Title>
            {setupDeletingDevice ? (
              <CircularProgress className={css.loading} size={styles.fontSizes.md} />
            ) : (
              <Tooltip title="Delete">
                <IconButton onClick={() => window.confirm(confirmMessage) && onDelete()} disabled={setupBusy}>
                  <Icon name="trash-alt" size="md" />
                </IconButton>
              </Tooltip>
            )}
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
        <Targets targetDevice={targetDevice} targets={targets} onUpdate={onUpdate} onCancel={onCancel} {...props} />
      </section>
    </Container>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
