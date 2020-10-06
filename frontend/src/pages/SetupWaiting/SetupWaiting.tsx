import React, { useEffect } from 'react'
import { Typography, CircularProgress, Divider } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { getDevices } from '../../models/accounts'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { DocsLinks } from '../../components/DocsLinks'
import { osName } from '../../shared/nameHelper'
import { Body } from '../../components/Body'
import styles from '../../styling'

type Props = { os?: Ios; targetDevice: ITargetDevice }

export const SetupWaiting: React.FC<Props> = ({ targetDevice, os }) => {
  const { globalError, device } = useSelector((state: ApplicationState) => ({
    globalError: state.backend.globalError,
    device: getDevices(state).find(d => d.id === targetDevice.uid),
  }))
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    if (device) {
      if (location.pathname.includes('/devices')) {
        history.push(`/devices/${device.id}/edit`)
      } else {
        history.push('settings/setupServices')
      }
    }
  }, [device])

  if (globalError) history.push('/settings')

  return (
    <Container header={<Breadcrumbs />}>
      <Body center={true}>
        <CircularProgress thickness={1.5} size={60} />
        <section>
          <Typography className={css.title} variant="h2" align="center">
            Your {osName(os)} is being registered with remote.it
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            This may take up to a minute to complete.
          </Typography>
        </section>
        <div className={css.divider}>
          <Divider />
        </div>
        <DocsLinks os={os} />
      </Body>
    </Container>
  )
}

const useStyles = makeStyles({
  title: { marginBottom: styles.spacing.sm },
  divider: { width: 400 },
})
