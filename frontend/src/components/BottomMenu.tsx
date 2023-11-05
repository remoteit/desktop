import React from 'react'
import { makeStyles } from '@mui/styles'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useHistory, useLocation } from 'react-router-dom'
import { Box, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material'
import { useCounts } from '../hooks/useCounts'
import { Icon } from './Icon'

export const BottomMenu: React.FC = () => {
  const location = useLocation()
  const history = useHistory()
  const counts = useCounts()
  const css = useStyles()

  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || '/devices'
  const isRootMenu = menu === location.pathname

  if (!isRootMenu) return null

  return (
    <Box className={css.list}>
      <BottomNavigation value={menu} onChange={(_, value) => history.push(value)}>
        <BottomNavigationAction
          label="Connections"
          icon={
            <Badge badgeContent={counts.active} color="primary">
              <Icon size="md" name="arrow-right-arrow-left" />
            </Badge>
          }
          value="/connections"
        />
        <BottomNavigationAction label="Devices" icon={<Icon size="md" name="router" />} value="/devices" />
        <BottomNavigationAction label="Networks" icon={<Icon size="md" name="chart-network" />} value="/networks" />
      </BottomNavigation>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    backgroundColor: palette.primary.main,
    '& .MuiBadge-badge': {
      top: -2,
      right: -10,
    },
  },
}))
