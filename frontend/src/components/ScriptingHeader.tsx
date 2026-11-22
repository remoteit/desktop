import { Button, Tooltip } from '@mui/material'
import { useMobile } from '../hooks/useMobile'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Link as RouteLink, useHistory, useLocation } from 'react-router-dom'
import { IconButton } from '../buttons/IconButton'
import { selectPermissions } from '../selectors/organizations'
import { ScriptingActionBar } from './ScriptingActionBar'
import { ScriptingTabBar } from './ScriptingTabBar'
import { Dispatch, State } from '../store'
import { ListToolbar } from './ListToolbar'
import { Container } from './Container'
import { Icon } from './Icon'
import { Link } from './Link'

type Props = {
  children?: React.ReactNode
  subheader?: React.ReactNode // under the tabs, outside the list's scrolling body (the files tab's storage)
}

export const ScriptingHeader: React.FC<Props> = ({ children, subheader }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const permissions = useSelector(selectPermissions)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const mobile = useMobile()

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
              '/runs/:fileID?',
              '/files/:fileID?',
              '/file/:fileID?',
              '/script/:fileID/:jobID?/:jobDeviceID?',
            ]}
            exact
          >
            <ScriptingActionBar />
          </Route>
          <ListToolbar
            tabs
            left={<ScriptingTabBar />}
            right={
              !selectedIds.length && (
                <Route path={['/scripts', '/runs', '/files']} exact>
                  {!mobile && (
                    <Button
                      size="small"
                      color="inherit"
                      sx={{ color: 'grayDarker.main' }}
                      onClick={() => {
                        dispatch.feedback.set({ subject: 'Beta Scripting Feedback' })
                        history.push('/feedback')
                      }}
                    >
                      {t('scriptingHeader.feedback', 'Feedback')}
                    </Button>
                  )}
                  <Link href="https://link.remote.it/desktop/help/device-scripting">
                    <IconButton color="grayDarker" icon="question-circle" title={t('scriptingHeader.help', 'Help')} />
                  </Link>
                  <Route path={['/scripts', '/files']} exact>
                    <Tooltip
                      title={
                        permissions.includes('ADMIN')
                          ? ''
                          : t('scriptingHeader.adminRequired', 'Admin permissions required to upload')
                      }
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
                          {location.pathname.startsWith('/files')
                            ? mobile
                              ? t('scriptingHeader.uploadShort', 'Upload')
                              : t('scriptingHeader.upload', 'Upload file')
                            : mobile
                            ? t('scriptingHeader.addShort', 'Add')
                            : t('scriptingHeader.add', 'Add script')}
                        </Button>
                      </span>
                    </Tooltip>
                  </Route>
                </Route>
              )
            }
          />
          {subheader}
        </>
      }
    >
      {children}
    </Container>
  )
}
