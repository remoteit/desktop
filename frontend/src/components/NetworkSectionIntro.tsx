import React from 'react'
import { useHistory } from 'react-router-dom'
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

/* The head of each Network page under its title: what the page is for, then its one Add action. */
export const NetworkSectionIntro: React.FC<{ intro: string; action?: string; to?: string }> = ({
  intro,
  action,
  to,
}) => {
  const history = useHistory()
  const phone = useMediaQuery(useTheme().breakpoints.down('sm'))
  return (
    <Gutters top="sm" bottom="md">
      <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1.5}>
        <Typography variant="body2" color="textSecondary">
          {intro}
        </Typography>
        {action && to && (
          <Button
            size="small"
            variant="contained"
            sx={{ minHeight: phone ? 40 : undefined }}
            startIcon={<Icon name="plus" size="sm" />}
            onClick={() => history.push(to)}
            data-create
          >
            {action}
          </Button>
        )}
      </Box>
    </Gutters>
  )
}
