import React, { useState, useEffect } from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { CircularProgress, Tooltip, IconButton, Typography } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Targets } from '../../components/Targets'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import styles from '../../styling'
import Analytics from '../../helpers/Analytics'

type Props = {
  os?: Ios
  targets: ITarget[]
  device: IDevice
}

export const SetupServices: React.FC<Props> = ({ device, os, targets, ...props }) => {
  const { added, cliError } = useSelector((state: ApplicationState) => ({
    added: state.backend.added,
    cliError: state.backend.cliError,
  }))
  const { devices, backend } = useDispatch<Dispatch>()
  const [deleting, setDeleting] = useState<boolean>(false)
  const confirmMessage = 'Are you sure?\nYou are about to permanently remove this device and all of its services.'
  const history = useHistory()
  const css = useStyles()

  // @TODO handle cli errors

  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => backend.set({ key: 'added', undefined })
  const onDelete = () => {
    setDeleting(true)
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
    if (deleting && !device.uid) {
      history.push('/settings/setupDevice')
      devices.fetch(false)
    }
  }, [device, devices, deleting])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1" gutterBottom>
            <Icon className={css.icon} name="hdd" size="md" weight="light" />
            <span className={css.title}>{device.name}</span>
            {deleting ? (
              <CircularProgress className={css.loading} size={styles.fontSizes.lg} />
            ) : (
              <Tooltip title="Delete">
                <IconButton onClick={() => window.confirm(confirmMessage) && onDelete()}>
                  <Icon name="trash-alt" size="md" />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
        </>
      }
    >
      <Typography variant="subtitle1" gutterBottom>
        Services
      </Typography>
      <section>
        <Targets device={device} onUpdate={onUpdate} onCancel={onCancel} added={added} cliError={cliError} {...props} />
      </section>
    </Container>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1 },
  icon: { marginRight: styles.spacing.md },
  loading: { color: styles.colors.gray, margin: styles.spacing.md },
})
