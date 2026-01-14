import { REGEX_FIRST_PATH, HIDE_SIDEBAR_WIDTH, MOBILE_WIDTH } from '../../constants'
import React, { useState, useRef } from 'react'
import useMobileBack from '../../hooks/useMobileBack'
import browser from '../../services/browser'
import { emit } from '../../services/Controller'
import { State } from '../../store'
import { Dispatch } from '../../store'
import { useMediaQuery, Typography } from '@mui/material'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { selectPermissions } from '../../selectors/organizations'
import { useLocation, Switch, Route } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { HeaderDeviceOptionMenu } from '../HeaderDeviceOptionMenu'
import { ProductsHeaderButtons } from './ProductsHeaderButtons'
import { ScriptDeleteButton } from '../ScriptDeleteButton'
import { UpgradeNotice } from '../UpgradeNotice'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { GlobalSearch } from '../GlobalSearch'
import { FilterButton } from '../../buttons/FilterButton'
import { IconButton } from '../../buttons/IconButton'
import { Title } from '../Title'
import { Box } from '@mui/material'

export const Header: React.FC = () => {
  const { searched } = useSelector(selectDeviceModelAttributes)
  const permissions = useSelector(selectPermissions)
  const canNavigate = useSelector((state: State) => state.backend.canNavigate)
  const layout = useSelector((state: State) => state.ui.layout)
  const overlapHeader = layout.hideSidebar && browser.isElectron && browser.isMac

  const mobileGoBack = useMobileBack()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()

  const manager = permissions.includes('MANAGE')
  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0]
  
  // Admin pages have two-level roots: /admin/users and /admin/partners (without IDs)
  const adminRootPages = ['/admin/users', '/admin/partners', '/partner-stats']
  const isAdminRootPage = adminRootPages.includes(location.pathname)
  const isRootMenu = menu === location.pathname || isAdminRootPage

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: 45,
          maxHeight: 45,
          width: '100%',
          zIndex: 14,
          paddingX: 2.25,
          marginTop: overlapHeader ? 3.5 : 1.5,
        }}
      >
        {sidebarHidden && (layout.singlePanel ? isRootMenu : true) && menu !== '/add' && (
          <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
        )}
        {(layout.hideSidebar || browser.isMobile) && (
          <>
            <Route path="/add" exact>
              <IconButton to="/devices" icon="chevron-left" size="md" color="grayDarker" />
            </Route>
            {!isRootMenu && <IconButton onClick={mobileGoBack} icon="chevron-left" size="md" color="grayDarker" />}
          </>
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
        {sidebarHidden && (
          <Route path={['/products', '/products/add']} exact>
            <Typography variant="h2">
              <Title>Products</Title>
            </Typography>
          </Route>
        )}
        <Route path={['/devices', '/connections', '/networks']}>
          {!showSearch && !searched && (
            <IconButton
              size="md"
              icon="search"
              color="grayDarker"
              title="Device Search"
              placement="bottom"
              fixedWidth
              onClick={() => {
                setShowSearch(true)
                setTimeout(() => inputRef.current?.focus(), 20)
              }}
            />
          )}
          {(!!showSearch || searched) && <GlobalSearch inputRef={inputRef} onClose={() => setShowSearch(false)} />}
        </Route>
        <Title />
        {!(showSearch && mobile) && (
          <>
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
            {!showSearch && (
              <Route path="/devices/:deviceID/:serviceID?">
                <HeaderDeviceOptionMenu />
              </Route>
            )}
            <Route path={['/products', '/products/add']} exact>
              <ProductsHeaderButtons />
            </Route>
            <Route path={layout.singlePanel ? '/script/:fileID' : '/script/:fileID/:jobID?/:jobDeviceID?'} exact>
              <ScriptDeleteButton />
            </Route>
          </>
        )}
      </Box>
      <UpgradeNotice />
    </>
  )
}
