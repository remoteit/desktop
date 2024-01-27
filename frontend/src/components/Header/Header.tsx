import { REGEX_FIRST_PATH, HIDE_SIDEBAR_WIDTH, MOBILE_WIDTH } from '../../constants'
import React, { useState, useRef } from 'react'
import useMobileBack from '../../hooks/useMobileBack'
import browser from '../../services/Browser'
import { emit } from '../../services/Controller'
import { State } from '../../store'
import { Dispatch } from '../../store'
import { makeStyles } from '@mui/styles'
import { useMediaQuery } from '@mui/material'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { selectPermissions } from '../../selectors/organizations'
import { useLocation, Switch, Route } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { HeaderDeviceOptionMenu } from '../HeaderDeviceOptionMenu'
import { UpgradeNotice } from '../UpgradeNotice'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { GlobalSearch } from '../GlobalSearch'
import { FilterButton } from '../../buttons/FilterButton'
import { RegisterMenu } from '../RegisterMenu'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { Title } from '../Title'
import { Pre } from '../Pre'

export const Header: React.FC = () => {
  const { searched, applicationTypes } = useSelector(selectDeviceModelAttributes)
  const permissions = useSelector(selectPermissions)
  const canNavigate = useSelector((state: State) => state.backend.canNavigate)
  const layout = useSelector((state: State) => state.ui.layout)
  const serviceList = !!applicationTypes?.length

  const mobileGoBack = useMobileBack()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const css = useStyles()
  const manager = permissions?.includes('MANAGE')
  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0]
  const isRootMenu = menu === location.pathname

  return (
    <>
      <div className={css.header}>
        {(layout.hideSidebar || browser.isMobile) && (
          <>
            <Route path="/add" exact>
              <IconButton to="/devices" icon="chevron-left" size="md" color="grayDarker" />
            </Route>
            {!isRootMenu && <IconButton onClick={mobileGoBack} icon="chevron-left" size="md" color="grayDarker" />}
          </>
        )}
        {sidebarHidden && (layout.singlePanel ? isRootMenu : true) && menu !== '/add' && (
          <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
        )}
        {!(showSearch || searched) && browser.isElectron && !layout.hideSidebar && (
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
        {!(showSearch && mobile) && (
          <>
            <Route path={['/devices', '/devices/select']} exact>
              <FilterButton />
              {!mobile && <ColumnsButton />}
            </Route>
            {manager && !serviceList && (
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
            <Route path="/devices/:deviceID/:serviceID?">
              <HeaderDeviceOptionMenu />
            </Route>
          </>
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
