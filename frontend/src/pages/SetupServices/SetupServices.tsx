import React, { useEffect } from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { CircularProgress, Tooltip, IconButton, Typography } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { Targets } from '../../components/Targets'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

type Props = {
  os?: Ios
  targets: ITarget[]
  device: ITargetDevice
}

export const SetupServices: React.FC<Props> = ({ device, os, targets, ...props }) => {
  const { setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))
  const { devices, ui } = useDispatch<Dispatch>()
  const confirmMessage = 'Are you sure?\nYou are about to permanently remove this device and all of its services.'
  const history = useHistory()
  const css = useStyles()
  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => ui.set({ setupAdded: undefined })
  const onDelete = () => {
    ui.set({ setupDeletingDevice: true, setupBusy: true })
    analytics.track('deviceRemoved', { deviceId: device.uid, deviceName: device.name })
    targets.forEach(target => {
      analytics.track('serviceRemoved', {
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
    if (setupDeletingDevice && !device.uid) {
      devices.fetch() // @FIXME this will only run if the page is active
      history.push('/settings/setupDevice')
    }
  }, [device, devices, setupBusy, history])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon className={css.icon} name="hdd" size="md" weight="light" />
            <span className={css.title}>{device.name}</span>
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
    >
      <Typography variant="subtitle1">Services</Typography>
      <section>
        <Targets device={device} targets={targets} onUpdate={onUpdate} onCancel={onCancel} {...props} />
      </section>
    </Container>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1 },
  icon: { marginRight: styles.spacing.md },
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
