import { REGEX_FIRST_PATH, HIDE_SIDEBAR_WIDTH, MOBILE_WIDTH } from '../../constants'
import React, { useState, useRef } from 'react'
import useMobileBack from '../../hooks/useMobileBack'
import browser from '../../services/Browser'
import { emit } from '../../services/Controller'
import { makeStyles } from '@mui/styles'
import { useMediaQuery } from '@mui/material'
import { selectPermissions } from '../../selectors/organizations'
import { ApplicationState, Dispatch } from '../../store'
import { useLocation, Switch, Route } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getDeviceModel } from '../../selectors/devices'
import { UpgradeNotice } from '../UpgradeNotice'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { GlobalSearch } from '../GlobalSearch'
import { FilterButton } from '../../buttons/FilterButton'
import { RegisterMenu } from '../RegisterMenu'
import { Breadcrumbs } from '../Breadcrumbs'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { Title } from '../Title'
import { Pre } from '../Pre'

export const Header: React.FC<{ breadcrumbs?: boolean }> = ({ breadcrumbs }) => {
  const mobileGoBack = useMobileBack()
  const { searched, canNavigate, permissions, layout } = useSelector((state: ApplicationState) => {
    const deviceModel = getDeviceModel(state)
    return {
      selected: state.ui.selected,
      searched: deviceModel.searched, // debug make true
      canNavigate: state.backend.canNavigate,
      permissions: selectPermissions(state),
      layout: state.ui.layout,
    }
  })
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const manager = permissions?.includes('MANAGE')
  const css = useStyles()
  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0]
  const isRootMenu = menu === location.pathname

  return (
    <>
      {breadcrumbs && <Breadcrumbs />}
      <div className={css.header}>
        {sidebarHidden && (layout.hideSidebar ? isRootMenu : true) && menu !== '/add' && (
          <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
        )}
        {!(showSearch || searched) && browser.isElectron && (
          <>
            <IconButton
              title="Back"
              placement="bottom"
              disabled={!canNavigate.canGoBack}
              onClick={() => emit('navigate', 'BACK')}
              icon="chevron-left"
              size="md"
              color={canNavigate.canGoBack ? 'grayDarker' : 'grayLight'}
            />
            <IconButton
              title="Forward"
              placement="bottom"
              disabled={!canNavigate.canGoForward}
              onClick={() => emit('navigate', 'FORWARD')}
              icon="chevron-right"
              size="md"
              color={canNavigate.canGoForward ? 'grayDarker' : 'grayLight'}
            />
          </>
        )}
        {!browser.isElectron && (
          <>
            <Route path="/add" exact>
              <IconButton to="/devices" icon="chevron-left" size="md" color="grayDarker" />
            </Route>
            {!isRootMenu && layout.hideSidebar && (
              <IconButton onClick={mobileGoBack} icon="chevron-left" size="md" color="grayDarker" />
            )}
          </>
        )}
        {!showSearch && <RefreshButton size="md" color="grayDarker" />}
        <Title className={css.search}>
          {!showSearch && !searched && (
            <IconButton
              size="md"
              icon="search"
              className={css.button}
              color="grayDarker"
              onClick={() => {
                setShowSearch(true)
                setTimeout(() => inputRef.current?.focus(), 20)
              }}
            />
          )}
          {(!!showSearch || searched) && <GlobalSearch inputRef={inputRef} onClose={() => setShowSearch(false)} />}
        </Title>
        <Route path={['/devices', '/devices/select']} exact>
          <FilterButton />
          {!mobile && <ColumnsButton />}
        </Route>
        {manager && (
          <Switch>
            <Route path="/devices" exact>
              <IconButton to="/devices/select" icon="check-square" title="Show Select" />
            </Route>
            <Route path="/devices/select" exact>
              <IconButton to="/devices" icon="check-square" type="solid" color="primary" title="Hide Select" />
            </Route>
          </Switch>
        )}
        {sidebarHidden && (
          <Route path="/devices" exact>
            <RegisterMenu buttonSize={26} size="sm" inline inlineLeft />
          </Route>
        )}
      </div>
      <UpgradeNotice />
    </>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    margin: `${spacing.sm}px 0 0`,
    padding: `0 ${spacing.md}px`,
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 45,
    maxHeight: 45,
    width: '100%',
    zIndex: 14,
  },
  search: {
    flexGrow: 1,
    zIndex: 1,
  },
  button: {
    WebkitAppRegion: 'no-drag',
    justifyContent: 'flex-start',
    minHeight: spacing.xxl,
  },
  selected: {
    marginRight: spacing.sm,
    marginLeft: spacing.sm,
  },
})
