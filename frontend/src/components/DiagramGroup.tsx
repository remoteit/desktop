import React, { useContext } from 'react'
import { useMatches, MatchesProps } from '../hooks/useMatches'
import { Box, ListItemButton, ListItemButtonProps } from '@mui/material'
import { DiagramIndicator, IndicatorProps } from './DiagramIndicator'
import { DiagramContext } from '../services/Context'
import { spacing } from '../styling'
import { Link } from 'react-router-dom'

export type DiagramGroupType = 'target' | 'initiator' | 'tunnel' | 'relay' | 'proxy' | 'lan' | 'endpoint'

type Props = MatchesProps & {
  type: DiagramGroupType
  indicator?: Omit<IndicatorProps, 'top'>
  flexGrow?: number | string
  children?: React.ReactNode
}

export const DiagramGroup: React.FC<Props> = ({ type, indicator, flexGrow = 'inherit', children }) => {
  const { highlightTypes, state, toTypes, relay: forward } = useContext(DiagramContext)
  const to = toTypes?.[type] || ''
  const selected = useMatches({ to })
  const highlight = highlightTypes.includes(type)

  let label: string = type
  let titleColor: string | undefined = undefined
  let sx: ListItemButtonProps['sx'] = {
    paddingBottom: 2,
    paddingTop: 5,
    paddingLeft: `${spacing.sm}px`,
  }

  switch (state) {
    case 'connected':
      titleColor = 'primary.main'
      break
  }

  switch (type) {
    case 'proxy':
      label = 'Proxy'
      // sx.maxWidth = 70
      break
    case 'tunnel':
      label = 'Tunnel'
      sx.paddingLeft = 0
      break
    case 'relay':
      if (forward) {
        label = 'Relay'
        // sx.maxWidth = 70
      } else {
        label = ''
        // sx.maxWidth = 20
      }
      break
    case 'lan':
      label = 'LAN'
      // sx.maxWidth = 100
      break
    case 'initiator':
      label = 'Local'
      // sx.maxWidth = 100
      break
    case 'target':
      label = 'Remote'
      // sx.maxWidth = 100
      sx.paddingLeft = 0
      sx.paddingRight = `${spacing.sm}px`
  }

  if (selected) {
    titleColor = 'grayDarkest.main'
  }

  if (highlight) {
    sx.backgroundColor = 'primary.main'
    titleColor = 'alwaysWhite.main'
  }

  return (
    <ListItemButton
      sx={sx}
      to={to}
      selected={selected}
      disabled={!to}
      style={{ flexGrow, opacity: 1 }}
      component={Link}
      disableGutters
    >
      {/* <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          top: spacing.sm,
          left: spacing.sm,
          color: 'grayLight.main',
        }}
      >
        {label}
      </Typography> */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'stretch',
        }}
      >
        {selected && <DiagramIndicator top="sm" {...indicator} />}
        {children}
      </Box>
    </ListItemButton>
  )
}
