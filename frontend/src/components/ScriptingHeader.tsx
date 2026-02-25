import { Button, Stack, Tooltip, useMediaQuery } from '@mui/material'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Link as RouteLink, useHistory, useLocation } from 'react-router-dom'
import { IconButton } from '../buttons/IconButton'
import { MOBILE_WIDTH } from '../constants'
import { selectPermissions } from '../selectors/organizations'
import { ScriptingActionBar } from './ScriptingActionBar'
import { ScriptingTabBar } from './ScriptingTabBar'
import { Dispatch, State } from '../store'
import { ColorChip } from './ColorChip'
import { Container } from './Container'
import { Icon } from './Icon'
import { Link } from './Link'

type Props = {
  children?: React.ReactNode
}

export const ScriptingHeader: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const permissions = useSelector(selectPermissions)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <Route
            path={[
              '/scripts',
              '/runs/:jobID?',
              '/files/:fileID?',
              '/file/:fileID?',
              '/script/:fileID/:jobID?/:jobDeviceID?',
            ]}
            exact
          >
            <ScriptingActionBar />
          </Route>
          <Stack flexDirection="row" justifyContent="space-between" alignItems="center" width="100%" paddingRight={4}>
            <ScriptingTabBar />
            {!selectedIds.length && (
              <Route path={['/scripts', '/runs', '/files']} exact>
                <Stack flexDirection="row" alignItems="center">
                  {!mobile && (
                    <ColorChip
                      label="Feedback"
                      size="small"
                      color="gray"
                      variant="text"
                      onClick={() => {
                        dispatch.feedback.set({ subject: 'Beta Scripting Feedback' })
                        history.push('/feedback')
                      }}
                    />
                  )}
                  <Link href="https://link.remote.it/desktop/help/device-scripting">
                    <IconButton color="grayDark" icon="question-circle" sx={{ paddingLeft: 0.5 }} />
                  </Link>
                  <Route path={['/scripts', '/files']} exact>
                    <Tooltip
                      title={permissions.includes('ADMIN') ? '' : 'Admin permissions required to upload'}
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
                          {location.pathname.startsWith('/files') ? 'Upload' : 'Add'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Route>
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
