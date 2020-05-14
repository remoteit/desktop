import React from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography, Tooltip, IconButton, Link, Divider, Button } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { osName } from '../../helpers/nameHelper'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

type Props = { os?: Ios; device: ITargetDevice }

export const SetupSuccess: React.FC<Props> = ({ device, os }) => {
  const history = useHistory()
  const css = useStyles()

  return (
    <Container
      header={
        <div className={css.header}>
          <Breadcrumbs />
          <Tooltip title="Close">
            <IconButton onClick={() => history.push('/settings/setupServices')}>
              <Icon name="times" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        </div>
      }
    >
      <Body center={true}>
        <Icon name="check-circle" color="success" size="xxxl" />
        <section>
          <Typography className={css.title} variant="h2" align="center">
            {device.name} Registered Successfully!
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            You can now remotely connect to this {osName(os)} from
            <Link href="https://app.remote.it" target="_blank">
              remote.it,
            </Link>
            give it a try.
          </Typography>
        </section>
        <div className={css.divider}>
          <Divider />
        </div>
        <section className={css.section}>
          <Typography variant="body2" align="center" color="textSecondary">
            Next, add remote access to devices on your network:
          </Typography>
          <Button color="primary" variant="contained" onClick={() => history.push('/settings/setupServices/network')}>
            Scan network
          </Button>
          <Button variant="contained" onClick={() => history.push('/settings/setupServices')}>
            Close
          </Button>
        </section>
      </Body>
    </Container>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: styles.spacing.md,
  },
  title: { marginBottom: styles.spacing.sm },
  divider: { width: 400 },
  section: {
    '&  Button': {
      display: 'block',
      margin: `${styles.spacing.lg}px auto 0`,
    },
    '& Button + Button': {
      marginTop: styles.spacing.sm,
    },
  },
})
