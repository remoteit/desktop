import React from 'react'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { useHistory } from 'react-router-dom'
import { IService } from 'remote.it'
import { ServiceListItem } from '../ServiceListItem'
import { Typography, Button, List } from '@material-ui/core'

export interface Props {
  connections: IConnection[]
  services: IService[]
}

export const ConnectionsList: React.FC<Props> = ({ connections, services }) => {
  const history = useHistory()

  if (!connections || !connections.length) {
    return (
      <Body center>
        <Typography variant="caption" gutterBottom>
          You have no connections
        </Typography>
        <Button onClick={() => history.push('/devices')} variant="contained" color="primary" size="medium">
          Add a Connection
          <Icon name="arrow-right" weight="regular" size="md" fixedWidth inline />
        </Button>
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
