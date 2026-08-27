import { REGEX_FIRST_PATH, MOBILE_WIDTH, CHAT_GUIDE_DATE } from '../../constants'
import { useChatEnabled, useHideSidebar } from '../../hooks/useChatEnabled'
import { GuideBubble } from '../GuideBubble'
import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useNavigationUp from '../../hooks/useNavigationUp'
import browser from '../../services/browser'
import { State } from '../../store'
import { Dispatch } from '../../store'
import { useMediaQuery, Typography } from '@mui/material'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { selectPermissions } from '../../selectors/organizations'
import { useLocation, Switch, Route } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { HeaderDeviceOptionMenu } from '../HeaderDeviceOptionMenu'
import { ProductsHeaderButtons } from './ProductsHeaderButtons'
import { UpgradeNotice } from '../UpgradeNotice'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { GlobalSearch } from '../GlobalSearch'
import { FilterButton } from '../../buttons/FilterButton'
import { IconButton } from '../../buttons/IconButton'
import { Title } from '../Title'
import { Box } from '@mui/material'

type Props = {
  panels?: number
}

export const Header: React.FC<Props> = ({ panels = 1 }) => {
  const { t } = useTranslation()
  const { searched } = useSelector(selectDeviceModelAttributes)
  const permissions = useSelector(selectPermissions)
  const chatOpen = useSelector((state: State) => state.chat.open)
  const chatPoppedOut = useSelector((state: State) => state.chat.poppedOut)
  const chatEnabled = useChatEnabled()
  const layout = useSelector((state: State) => state.ui.layout)
  const overlapHeader = layout.hideSidebar && browser.isElectron && browser.isMac

  const navigateUp = useNavigationUp(panels)
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const sidebarHidden = useHideSidebar()
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()

  const manager = permissions.includes('MANAGE')
  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0]

  // Admin pages have two-level roots: /admin/users and /admin/partners (without IDs)
  const adminRootPages = [
    '/admin/users',
    '/admin/admins',
    '/admin/partners',
    '/admin/enterprise-licenses',
    '/admin/devices',
    '/admin/notices',
    '/partner-stats',
  ]
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
          <Route path="/add" exact>
            <IconButton
              title={t('header.back', 'Back')}
              to="/devices"
              icon="chevron-left"
              size="md"
              color="grayDarker"
            />
          </Route>
        )}
        {!isRootMenu && (
          <IconButton
            title={t('header.back', 'Back')}
            onClick={navigateUp}
            icon="chevron-left"
            size="md"
            color="grayDarker"
          />
        )}
        {/* Step 1 of the chat tour. Deliberately no startDate — this is new to everyone,
            including long-standing accounts, so the usual "only for recent signups" cohort
            gate would hide it from the people who most need it. The delay lets the app
            settle before it speaks up. */}
        {chatEnabled && !chatPoppedOut && (
          <GuideBubble
            guide="chatAgent"
            added={CHAT_GUIDE_DATE}
            placement="bottom"
            enterDelay={1200}
            instructions={
              <>
                <Typography variant="h3" gutterBottom>
                  <b>{t('chat.guideAgentTitle', 'Meet Remote.It AI')}</b>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {t(
                    'chat.guideAgentBody',
                    'Ask about your devices, connections and services — or tell it to make changes. Open and close it here any time.'
                  )}
                </Typography>
              </>
            }
          >
            <IconButton
              fixedWidth
              icon="remote-ai"
              size="lg"
              color={chatOpen ? 'primary' : 'grayDarker'}
              title={t('header.aiAgent', 'AI Agent')}
              onClick={() => dispatch.chat.set({ open: !chatOpen })}
            />
          </GuideBubble>
        )}
        {!showSearch && <RefreshButton size="md" color="grayDarker" />}
        {sidebarHidden && (
          <Route path="/products">
            <Typography variant="h2">
              <Title>{t('header.products', 'Products')}</Title>
            </Typography>
          </Route>
        )}
        <Route path={['/devices', '/connections', '/networks']}>
          {!showSearch && !searched && (
            <IconButton
              size="md"
              icon="search"
              color="grayDarker"
              title={t('header.deviceSearch', 'Device Search')}
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
                  <IconButton to="/devices/select" icon="check-square" title={t('header.showSelect', 'Show Select')} />
                </Route>
                <Route path="/devices/select" exact>
                  <IconButton
                    to="/devices"
                    icon="check-square"
                    type="solid"
                    color="primary"
                    title={t('header.hideSelect', 'Hide Select')}
                  />
                </Route>
              </Switch>
            )}
            {!showSearch && (
              <Route path="/devices/:deviceID/:serviceID?">
                <HeaderDeviceOptionMenu />
              </Route>
            )}
            <Route path={['/products', '/products/select']} exact>
              <ProductsHeaderButtons />
            </Route>
          </>
        )}
      </Box>
      <UpgradeNotice />
    </>
  )
}
