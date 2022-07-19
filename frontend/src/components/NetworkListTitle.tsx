import React from 'react'
import { ListItemLocation } from './ListItemLocation'
import { useStyles } from './NetworkListItem'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  network?: INetwork
  expanded?: boolean
  children?: React.ReactNode
}

export const NetworkListTitle: React.FC<Props> = ({ network, expanded, children }) => {
  const css = useStyles({ enabled: network?.enabled })

  return (
    <ListItemLocation
      className={css.item}
      icon={<Icon className={css.mergeIcon} name={network?.icon} color={network?.enabled ? 'primary' : undefined} />}
      pathname={`/networks/view/${network?.id}`}
      title={
        <Title enabled={network?.enabled}>
          {network?.name}
          {expanded ? '' : ' ...'}
        </Title>
      }
      dense
    >
      {children}
    </ListItemLocation>
  )
}
