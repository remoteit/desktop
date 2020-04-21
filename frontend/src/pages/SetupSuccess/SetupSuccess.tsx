import React from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography, Tooltip, IconButton, Link, Divider, List, ListItem, ListItemText } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { osName } from '../../helpers/nameHelper'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

type Props = { os?: Ios; device: IDevice }

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
            You can now connect to this {osName(os)} from any
            <Link href="https://remote.it" target="_blank">
              remote.it
            </Link>
            enabled device.
          </Typography>
        </section>
        <div className={css.divider}>
          <Divider />
        </div>
        <section className={css.links}>
          <Typography variant="body2" align="center" gutterBottom>
            What's next?
          </Typography>
          <Link href="https://google.com" target="_blank">
            Connect to this {osName(os)} from another device
            <Icon className={css.rotate} name="arrow-right" size="sm" weight="regular" />
          </Link>
          <Link href="https://google.com" target="_blank">
            Connect to a Windows Remote Desktop
            <Icon className={css.rotate} name="arrow-right" size="sm" weight="regular" />
          </Link>
          <Link href="https://google.com" target="_blank">
            Connect to a Mac Screen Share <Icon className={css.rotate} name="arrow-right" size="sm" weight="regular" />
          </Link>
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
  rotate: { transform: 'rotate(-45deg)', paddingLeft: 5, marginLeft: 3 },
  links: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
})
