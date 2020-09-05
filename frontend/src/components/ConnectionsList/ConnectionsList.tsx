import React from 'react'
import { Body } from '../Body'
import { Title } from '../Title'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { ForgetButton } from '../../buttons/ForgetButton'
import { ServiceListItem } from '../ServiceListItem'
import { Typography, Link, List, Divider } from '@material-ui/core'
import styles from '../../styling'

export interface Props {
  connections: IConnection[]
  services: IService[]
}

export const ConnectionsList: React.FC<Props> = ({ connections, services }) => {
  const history = useHistory()
  const css = useStyles()

  if (!connections || !connections.length) {
    return (
      <Body center>
        <Typography className={css.message} variant="h2" align="center">
          Use this page to manage frequently used connections
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          Once you've made a connection to a service from the
          <Link onClick={() => history.push('/devices')}>Devices</Link>tab, <br />
          active and recent connections will appear here.
        </Typography>
      </Body>
    )
  }

  const connected = connections.filter(c => c.active)
  const recent = connections.filter(c => !c.active)

  return (
    <List>
      {!!connected.length && (
        <Typography variant="subtitle1">
          <Title>Connected</Title>
        </Typography>
      )}
      {connected.map(c => (
        <ServiceListItem key={c.id || 0} connection={c} service={services.find(s => s.id === c.id)} />
      ))}
      {!!recent.length && !!connected.length && <Divider className={css.divider} />}
      {!!recent.length && (
        <Typography variant="subtitle1">
          <Title>Recent</Title>
          <ForgetButton all />
        </Typography>
      )}
      {recent.map(c => (
        <ServiceListItem key={c.id || 0} connection={c} service={services.find(s => s.id === c.id)} dense />
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  divider: { marginTop: styles.spacing.lg },
  message: { marginBottom: styles.spacing.xl },
})
