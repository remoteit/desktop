import React from 'react'
import classnames from 'classnames'
import { ListItemLocation } from './ListItemLocation'
import { useStyles } from './ConnectionListItem'
import { Avatar } from './Avatar'
import { Title } from './Title'
import { Icon } from './Icon'
import { Box } from '@mui/material'

export interface Props {
  network?: INetwork
  expanded?: boolean
  offline?: boolean
  noLink?: boolean
  enabled?: boolean
  onClick?: (event: React.MouseEvent) => void
  children?: React.ReactNode
}

export const NetworkListTitle: React.FC<Props> = ({
  network,
  expanded = true,
  offline,
  noLink,
  enabled,
  onClick,
  children,
}) => {
  const css = useStyles({ enabled, offline })
  return (
    <ListItemLocation
      className={css.item}
      exactMatch
      icon={
        <>
          {noLink && network?.owner?.id ? (
            <Box className={css.mergeIcon}>
              <Avatar
                email={network?.owner.email}
                fallback={network?.name === 'Personal' ? undefined : network?.name}
                size={24}
              />
            </Box>
          ) : (
            <Icon
              className={classnames(css.mergeIcon, noLink || 'hoverHide')}
              name={network?.icon}
              type={network?.iconType}
              color={enabled ? 'primary' : undefined}
            />
          )}
          {!noLink && (
            <Icon
              className={classnames(css.mergeIcon, css.hover, 'hidden')}
              name="sliders-h"
              type="light"
              size="md"
              color={enabled ? 'primary' : undefined}
            />
          )}
        </>
      }
      to={noLink ? undefined : `/networks/${network?.id}`}
      onClick={noLink ? onClick : undefined}
      title={
        <Title>
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
