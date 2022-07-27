import React from 'react'
import { ListItemLocation } from './ListItemLocation'
import { useStyles } from './NetworkListItem'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  network?: INetwork
  expanded?: boolean
  offline?: boolean
  noLink?: boolean
  children?: React.ReactNode
}

export const NetworkListTitle: React.FC<Props> = ({ network, expanded = true, offline, noLink, children }) => {
  const css = useStyles({ enabled: network?.enabled, offline })

  return (
    <ListItemLocation
      className={css.item}
      icon={<Icon className={css.mergeIcon} name={network?.icon} color={network?.enabled ? 'primary' : undefined} />}
      pathname={noLink ? undefined : `/networks/view/${network?.id}`}
      title={
        <Title className={css.text} enabled={network?.enabled}>
          <b>{network?.name}</b>
          {expanded ? '' : ' ...'}
        </Title>
      }
      dense
    >
      {children}
    </ListItemLocation>
  )
}
