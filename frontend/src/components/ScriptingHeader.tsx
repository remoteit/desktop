import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { Stack, Button, Tooltip } from '@mui/material'
import { Link, Route, useLocation } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { ScriptingActionBar } from './ScriptingActionBar'
import { ScriptingTabBar } from './ScriptingTabBar'
import { Container } from './Container'
import { Icon } from './Icon'

type Props = {
  children?: React.ReactNode
}

export const ScriptingHeader: React.FC<Props> = ({ children }) => {
  const location = useLocation()
  const permissions = useSelector(selectPermissions)
  const selectedIds = useSelector((state: State) => state.ui.selected)

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <ScriptingActionBar />
          <Stack flexDirection="row" justifyContent="space-between" alignItems="center" width="100%" paddingRight={4}>
            <ScriptingTabBar />
            {!selectedIds.length && (
              <Route path={['/scripting/scripts', '/scripting/runs']}>
                <Tooltip
                  title={permissions.includes('ADMIN') ? '' : 'Admin permissions required to add scripts'}
                  placement="top"
                  arrow
                >
                  <span>
                    <Button
                      to={location.pathname + '/add'}
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
              </Route>
            )}
          </Stack>
        </>
      }
    >
      {children}
    </Container>
  )
}
