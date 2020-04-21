import React from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography, CircularProgress, Divider } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { osName } from '../../helpers/nameHelper'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import { DocsLinks } from '../../components/DocsLinks'
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
