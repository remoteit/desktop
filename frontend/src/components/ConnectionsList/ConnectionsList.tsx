import React from 'react'
import { Body } from '../../components/Body'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { ServiceListItem } from '../ServiceListItem'
import { Typography, Link, List } from '@material-ui/core'
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

  return (
    <List>
      {connections.map(c => (
        <ServiceListItem key={c.id || 0} connection={c} service={services.find(s => s.id === c.id)} />
      ))}
    </List>
  )
}

const useStyles = makeStyles({ message: { marginBottom: styles.spacing.xl } })
