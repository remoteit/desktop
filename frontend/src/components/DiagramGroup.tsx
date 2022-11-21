import React, { useContext } from 'react'
import { useMatches, MatchesProps } from '../hooks/useMatches'
import { Box, ListItemButton, ListItemButtonProps, Tooltip, InputLabel } from '@mui/material'
import { DiagramIndicator, IndicatorProps } from './DiagramIndicator'
import { DiagramContext } from '../services/Context'
import { spacing } from '../styling'
import { Link } from 'react-router-dom'

export type DiagramGroupType = 'target' | 'initiator' | 'tunnel' | 'forward' | 'proxy' | 'lan'

type Props = MatchesProps & {
  type: DiagramGroupType
  disabled?: boolean
  indicator?: Omit<IndicatorProps, 'top'>
  children?: React.ReactNode
}

export const DiagramGroup: React.FC<Props> = ({ disabled, type, indicator, children }) => {
  const { highlightTypes, state, toTypes } = useContext(DiagramContext)
  const to = toTypes?.[type] || ''
  const selected = useMatches({ to })
  const highlight = highlightTypes.includes(type)

  let label: string = type
  let tooltip = ''
  let titleColor: string | undefined = undefined
  let sx: ListItemButtonProps['sx'] = {
    display: 'block',
    flexGrow: 1,
    paddingBottom: 2,
    paddingTop: 4,
  }

  switch (state) {
    case 'connected':
      titleColor = 'primary.main'
      break
  }

  switch (type) {
    case 'proxy':
      tooltip = 'Cloud proxy initiator'
      sx.maxWidth = 80
      break
    case 'tunnel':
      tooltip = 'Remote.It Secure tunnel'
      break
    case 'forward':
      label = 'Host'
      tooltip = 'System running the remoteit agent'
      sx.maxWidth = 80
      break
    case 'lan':
      sx.paddingLeft = 2
      sx.maxWidth = 100
      break
    case 'initiator':
      label = 'Source'
      tooltip = 'Initiator'
      sx.paddingLeft = 2
      sx.maxWidth = 100
      break
    case 'target':
      tooltip = 'System hosting the service'
      sx.maxWidth = 100
      sx.paddingRight = 2
  }

  if (selected) {
    titleColor = 'grayDarkest.main'
  }

  if (highlight) {
    sx.backgroundColor = 'primary.main'
    titleColor = 'alwaysWhite.main'
  }

  return (
    // <Tooltip title={tooltip} placement="top" arrow>
    <ListItemButton
      sx={sx}
      to={to}
      selected={selected}
      disabled={!to}
      style={{ opacity: 1 }}
      component={Link}
      disableGutters
    >
      <InputLabel
        shrink
        sx={{
          position: 'absolute',
          top: spacing.sm,
          left: spacing.md,
          color: titleColor,
        }}
      >
        {label}
      </InputLabel>
      <Box
        sx={{
          opacity: disabled ? 0.5 : 1,
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'stretch',
        }}
      >
        {selected && <DiagramIndicator top="sm" {...indicator} />}
        {children}
      </Box>
    </ListItemButton>
    // </Tooltip>
  )
}
