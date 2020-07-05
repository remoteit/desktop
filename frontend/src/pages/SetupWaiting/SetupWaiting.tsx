import React from 'react'
import { Typography, CircularProgress, Divider } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { DocsLinks } from '../../components/DocsLinks'
import { Dispatch } from '../../store'
import { osName } from '../../shared/nameHelper'
import { Body } from '../../components/Body'
import styles from '../../styling'

type Props = { os?: Ios; device: ITargetDevice }

export const SetupWaiting: React.FC<Props> = ({ device, os }) => {
  const { globalError } = useSelector((state: ApplicationState) => state.backend)
  const { devices, ui } = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()

  if (device.uid) {
    history.push('/settings/setupServices')
    ui.set({ successMessage: `${device.name} registered successfully!` })
    devices.fetch()
  }

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
