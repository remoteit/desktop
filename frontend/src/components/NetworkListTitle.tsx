import React from 'react'
import { ListItemLocation } from './ListItemLocation'
import { useStyles } from './NetworkListItem'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  serviceId?: string
  network?: INetwork
}

export const NetworkListTitle: React.FC<Props> = ({ network, serviceId, children }) => {
  const css = useStyles({ enabled: network?.enabled })

  return (
    <ListItemLocation
      className={css.title}
      icon={<Icon className={css.mergeIcon} name={network?.icon} color={network?.enabled ? 'primary' : undefined} />}
      pathname={`/networks/view/${network?.id}`}
      title={<Title enabled={network?.enabled}>{network?.name}</Title>}
      dense
    >
      {children}
    </ListItemLocation>
  )
}
