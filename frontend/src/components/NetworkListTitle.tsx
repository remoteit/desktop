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
        <Icon
          className={css.mergeIcon}
          name={network?.icon}
          type={network?.iconType}
          color={network?.enabled ? 'primary' : undefined}
        />
      }
      pathname={noLink ? undefined : `/networks/view/${network?.id}`}
      onClick={noLink ? onClick : undefined}
      title={
        <>
          {network?.shared && (
            <Tooltip title={`Shared by ${network?.owner?.email}`} enterDelay={400} placement="top" arrow>
              <span className="tooltip">
                <Avatar email={network?.owner?.email} size={24} />
              </span>
            </Tooltip>
          )}
          <Title className={css.text} enabled={network?.enabled}>
            <b>{network?.name}</b>
            {expanded ? '' : ' ...'}
          </Title>
        </>
      }
      dense
    >
      {children}
    </ListItemLocation>
  )
}
