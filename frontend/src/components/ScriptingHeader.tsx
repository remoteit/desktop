import React from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Stack, Button, Tooltip } from '@mui/material'
import { Link as RouteLink, Route, useLocation, useHistory } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { ScriptingActionBar } from './ScriptingActionBar'
import { ScriptingTabBar } from './ScriptingTabBar'
import { IconButton } from '../buttons/IconButton'
import { Container } from './Container'
import { ColorChip } from './ColorChip'
import { Link } from './Link'
import { Icon } from './Icon'

type Props = {
  children?: React.ReactNode
}

export const ScriptingHeader: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
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
                <Stack flexDirection="row" alignItems="center">
                  <ColorChip
                    label="BETA Feedback"
                    size="small"
                    color="grayLightest"
                    variant="contained"
                    sx={{ marginRight: -0.5 }}
                    onClick={() => {
                      dispatch.feedback.set({ subject: 'Beta Scripting Feedback' })
                      history.push('/feedback')
                    }}
                  />
                  <Link href="https://link.remote.it/desktop/help/device-scripting">
                    <IconButton color="grayDark" icon="question-circle" />
                  </Link>
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
                        component={RouteLink}
                      >
                        Add
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
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
