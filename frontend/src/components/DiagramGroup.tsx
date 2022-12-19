import React, { useContext } from 'react'
import { useMatches, MatchesProps } from '../hooks/useMatches'
import { Box, ListItemButton, ListItemButtonProps } from '@mui/material'
import { DiagramIndicator, IndicatorProps } from './DiagramIndicator'
import { DiagramContext } from '../services/Context'
import { spacing } from '../styling'
import { Link } from 'react-router-dom'

type Props = MatchesProps & {
  type: DiagramGroupType
  indicator?: Omit<IndicatorProps, 'top'>
  flexGrow?: number | string
  children?: React.ReactNode
}

export const DiagramGroup: React.FC<Props> = ({ type, indicator, flexGrow = 'inherit', children }) => {
  const { highlightTypes, state, toTypes } = useContext(DiagramContext)
  const to = toTypes?.[type] || ''
  const selected = useMatches({ to })
  const highlight = highlightTypes.includes(type)

  let sx: ListItemButtonProps['sx'] = {
    paddingBottom: 2,
    paddingTop: 5,
    paddingLeft: `${spacing.md}px`,
  }

  switch (state) {
    case 'connected':
      break
  }

  switch (type) {
    case 'proxy':
      break
    case 'tunnel':
      sx.paddingLeft = 0
      break
    case 'relay':
      break
    case 'lan':
      break
    case 'initiator':
      break
    case 'target':
      sx.paddingLeft = 0
      sx.paddingRight = `${spacing.md}px`
  }

  if (selected) {
  }

  if (highlight) {
    sx.backgroundColor = 'primary.main'
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
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'stretch',
        }}
      >
        {selected && <DiagramIndicator {...indicator} />}
        {children}
      </Box>
    </ListItemButton>
  )
}
