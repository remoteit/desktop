import React from 'react'
import { Icon } from '../../components/Icon'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { IService } from 'remote.it'
import { ServiceListItem } from '../ServiceListItem'
import { Typography, Button, List } from '@material-ui/core'
import { spacing } from '../../styling'

export interface Props {
  connections: IConnection[]
  services: IService[]
}

export const ConnectionsList: React.FC<Props> = ({ connections, services }) => {
  const css = useStyles()
  const history = useHistory()

  if (!connections || !connections.length) {
    return (
      <div className={css.page}>
        <Typography variant="caption">You have no connections</Typography>
        <Button onClick={() => history.push('/devices')} variant="contained" color="primary" size="medium">
          Add a Connection
          <Icon name="arrow-right" weight="regular" size="md" fixedWidth inline />
        </Button>
      </div>
    )
  }

  return (
    <List>
      {connections.map(c => (
        <ServiceListItem
          key={c.id || 0}
          connection={c}
          service={services.find(s => s.id === c.id)}
          nameType="connection"
        />
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '100%',
    padding: `${spacing.md}px ${spacing.md}px`,
    '& > span': { marginBottom: spacing.md },
  },
})
