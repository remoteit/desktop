import React from 'react'
import classnames from 'classnames'
import { networkName } from '../models/networks'
import { ListItemLocation } from './ListItemLocation'
import { itemSx } from './ConnectionListItem'
import { Avatar } from './Avatar'
import { Title } from './Title'
import { Icon } from './Icon'
import { Box, useTheme } from '@mui/material'

export interface Props {
  network?: INetwork
  expanded?: boolean
  noLink?: boolean
  enabled?: boolean
  onClick?: (event: React.MouseEvent) => void
  children?: React.ReactNode
}

export const NetworkListTitle: React.FC<Props> = ({
  network,
  expanded = true,
  noLink,
  enabled,
  onClick,
  children,
}) => {
  const theme = useTheme()
  return (
    <ListItemLocation
      sx={{
        ...(itemSx as object),
        '& .mergeIcon': {
          zIndex: 2,
          backgroundImage: `radial-gradient(${theme.palette.white.main}, transparent)`,
        },
        '& .sliderIcon': {
          position: 'absolute',
          marginTop: '-1px',
        },
      }}
      exactMatch
      icon={
        <>
          {noLink && network?.owner?.id ? (
            <Box className="mergeIcon">
              <Avatar
                email={network?.owner.email}
                fallback={network?.name === 'Personal' ? undefined : network?.name}
                size={24}
              />
            </Box>
          ) : (
            <Icon
              className={classnames('mergeIcon', noLink || 'hoverHide')}
              name={network?.icon}
              type={network?.iconType}
              color={enabled ? 'primary' : undefined}
            />
          )}
          {!noLink && (
            <Icon
              className={classnames('mergeIcon', 'sliderIcon', 'hidden')}
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
          {networkName(network?.name)}
          {expanded ? '' : ' ...'}
        </Title>
      }
      dense
    >
      {children}
    </ListItemLocation>
  )
}
