import React from 'react'
import { ListItemLocation } from './ListItemLocation'
import { useStyles } from './NetworkListItem'
import { Tooltip } from '@mui/material'
import { Avatar } from './Avatar'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  network?: INetwork
  expanded?: boolean
  offline?: boolean
  noLink?: boolean
  onClick?: () => void
  children?: React.ReactNode
}

export const NetworkListTitle: React.FC<Props> = ({ network, expanded = true, offline, noLink, onClick, children }) => {
  const css = useStyles({ enabled: network?.enabled, offline })
  return (
    <ListItemLocation
      className={css.item}
      icon={
        false ? (
          <Avatar email={network?.owner?.email} size={24} />
        ) : (
          <Icon
            className={css.mergeIcon}
            name={network?.icon}
            type={network?.iconType}
            color={network?.enabled ? 'primary' : undefined}
          />
        )
      }
      pathname={noLink ? undefined : `/networks/view/${network?.id}`}
      onClick={noLink ? onClick : undefined}
      title={
        <Title className={css.text} enabled={network?.enabled}>
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
