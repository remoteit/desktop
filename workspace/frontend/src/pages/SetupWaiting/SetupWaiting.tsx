import React, { useEffect } from 'react'
import { Typography, CircularProgress, Divider } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { getDevices } from '../../models/accounts'
import { makeStyles } from '@material-ui/core/styles'
import { DocsLinks } from '../../components/DocsLinks'
import { osName } from '../../shared/nameHelper'
import { Body } from '../../components/Body'
import styles from '../../styling'

type Props = { os?: Ios; targetDevice: ITargetDevice }

export const SetupWaiting: React.FC<Props> = ({ targetDevice, os }) => {
  const { errorMessage, device } = useSelector((state: ApplicationState) => ({
    errorMessage: state.ui.errorMessage,
    device: getDevices(state).find(d => d.id === targetDevice.uid),
  }))
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    if (device) history.push(`/devices/${device.id}`)
  }, [device])

  if (errorMessage) history.push('/devices/setup')

  return (
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
  )
}

const useStyles = makeStyles({
  title: { marginBottom: styles.spacing.sm },
  divider: { width: 400 },
})
