import React from 'react'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { IService } from 'remote.it'
import { ServiceListItem } from '../ServiceListItem'
import { Typography, Button, List } from '@material-ui/core'
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
          You have no outbound connections
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          Select device to connect to from the devices tab below.
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
