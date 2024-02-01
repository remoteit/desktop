import React from 'react'
import { REGEX_FIRST_PATH } from '../constants'
import { useHistory, useLocation } from 'react-router-dom'
import { Box, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material'
import { useCounts } from '../hooks/useCounts'
import { Icon } from './Icon'

type Props = {
  layout: ILayout
}

export const BottomMenu: React.FC<Props> = ({ layout }) => {
  const location = useLocation()
  const history = useHistory()
  const counts = useCounts()

  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || '/devices'

  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: layout.mobile ? 'transparent' : 'grayLighter.main',
        paddingBottom: layout.insets.bottom ? layout.insets.bottom + 'px' : 0,
        '& .MuiBadge-badge': {
          top: -2,
          right: -10,
        },
      }}
    >
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
