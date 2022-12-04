import React, { useEffect } from 'react'
import { Typography, CircularProgress, Divider } from '@mui/material'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { getDevices } from '../../selectors/devices'
import { makeStyles } from '@mui/styles'
import { DocsLinks } from '../../components/DocsLinks'
import { osName } from '../../shared/nameHelper'
import { Body } from '../../components/Body'
import { spacing } from '../../styling'

type Props = { os?: Ios }

export const SetupWaiting: React.FC<Props> = ({ os }) => {
  const { errorMessage, device } = useSelector((state: ApplicationState) => ({
    errorMessage: state.ui.errorMessage,
    device: getDevices(state).find(d => d.thisDevice),
  }))
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    if (device) history.push(`/devices/${device.id}`)
  }, [device])

  if (errorMessage) history.push('/devices/setup')

  return (
    <Body center>
      <CircularProgress thickness={1.5} size={60} />
      <section>
        <Typography className={css.title} variant="h3" align="center" gutterBottom>
          Your {osName(os)} is being registered with remote.it
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
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
  title: { marginTop: spacing.xl },
  divider: { width: 400, marginBottom: spacing.xl, marginTop: spacing.md },
})
