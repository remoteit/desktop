import React from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography, CircularProgress } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { osName } from '../../helpers/nameHelper'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import styles from '../../styling'

type Props = { os?: Ios; device: IDevice }

export const SetupWaiting: React.FC<Props> = ({ device, os }) => {
  const history = useHistory()
  const css = useStyles()

  if (device.uid) history.push('/settings/setupSuccess')

  return (
    <Container header={<Breadcrumbs />}>
      <Body center={true}>
        <CircularProgress thickness={1.5} size={60} />
        <Typography className={css.title} variant="h2" align="center">
          Registering {device.name}
        </Typography>
        <section>
          <Typography variant="body2" align="center" color="textSecondary">
            Your {osName(os)} is being registered with remote.it.
            <br />
            This screen will update when complete.
          </Typography>
        </section>
      </Body>
    </Container>
  )
}

const useStyles = makeStyles({
  title: { marginTop: styles.spacing.lg },
})
