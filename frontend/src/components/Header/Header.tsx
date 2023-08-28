import React, { useState, useRef } from 'react'
import { HIDE_SIDEBAR_WIDTH, MOBILE_WIDTH } from '../../shared/constants'
import { emit } from '../../services/Controller'
import { makeStyles } from '@mui/styles'
import { useMediaQuery } from '@mui/material'
import { selectPermissions } from '../../selectors/organizations'
import { ApplicationState, Dispatch } from '../../store'
import { useHistory, Switch, Route } from 'react-router-dom'
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
import { isElectron } from '../../services/Browser'
import { Title } from '../Title'
import { spacing } from '../../styling'

export const Header: React.FC<{ breadcrumbs?: boolean }> = ({ breadcrumbs }) => {
  const { searched, canNavigate, permissions } = useSelector((state: ApplicationState) => {
    const deviceModel = getDeviceModel(state)
    return {
      selected: state.ui.selected,
      searched: deviceModel.searched, // debug make true
      canNavigate: state.backend.canNavigate,
      permissions: selectPermissions(state),
    }
  })
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const manager = permissions?.includes('MANAGE')
  const css = useStyles()

  return (
    <>
      <Breadcrumbs show={breadcrumbs} />
      <div className={css.header}>
        {sidebarHidden && (
          <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
        )}
        {!(showSearch || searched) && isElectron() && (
          <>
            <IconButton
              title="Back"
              disabled={!canNavigate.canGoBack}
              onClick={() => emit('navigate', 'BACK')}
              icon="chevron-left"
              size="md"
              color={canNavigate.canGoBack ? 'grayDarker' : 'grayLight'}
            />
            <IconButton
              title="Forward"
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
          <Switch>
            <Route path="/add" exact>
              <IconButton icon="times" size="lg" onClick={history.goBack} />
            </Route>
            <Route path="*">
              <RegisterMenu buttonSize={26} size="sm" inline inlineLeft />
            </Route>
          </Switch>
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
