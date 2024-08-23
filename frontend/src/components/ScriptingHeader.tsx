import React from 'react'
import { useSelector } from 'react-redux'
import { Stack, Button, Tooltip } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { DevicesActionBar } from './DevicesActionBar'
import { ScriptingTabBar } from './ScriptingTabBar'
import { Container } from './Container'
import { Icon } from './Icon'

type Props = {
  children?: React.ReactNode
}

export const ScriptingHeader: React.FC<Props> = ({ children }) => {
  const location = useLocation()
  const permissions = useSelector(selectPermissions)

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <DevicesActionBar displayOnly />
          <Stack flexDirection="row" justifyContent="space-between" alignItems="center" width="100%" paddingRight={4}>
            <ScriptingTabBar />
            <Tooltip
              title={permissions.includes('ADMIN') ? '' : 'Admin permissions required to add scripts'}
              placement="top"
              arrow
            >
              <span>
                <Button
                  to="/scripting/scripts/new"
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={location.pathname.includes('new') || !permissions.includes('ADMIN')}
                  startIcon={<Icon name="plus" />}
                  component={Link}
                >
                  Add
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </>
      }
    >
      {children}
    </Container>
  )
}
