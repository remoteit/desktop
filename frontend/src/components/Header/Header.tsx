import React, { useState, useRef } from 'react'
import { emit } from '../../services/Controller'
import { makeStyles } from '@mui/styles'
import { getActiveAccountId } from '../../selectors/accounts'
import { useMediaQuery } from '@mui/material'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { getDeviceModel } from '../../selectors/devices'
import { HIDE_SIDEBAR_WIDTH } from '../../shared/constants'
import { selectLimitsLookup } from '../../selectors/organizations'
import { canEditTags } from '../../models/tags'
import { GlobalSearch } from '../GlobalSearch'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { FilterButton } from '../../buttons/FilterButton'
import { Breadcrumbs } from '../Breadcrumbs'
import { IconButton } from '../../buttons/IconButton'
import { isElectron } from '../../services/Browser'
import { Title } from '../Title'
import { Route } from 'react-router-dom'
import { spacing } from '../../styling'

export const Header: React.FC<{ breadcrumbs?: boolean }> = ({ breadcrumbs }) => {
  const { searched, canNavigate, feature, editTags } = useSelector((state: ApplicationState) => {
    const deviceModel = getDeviceModel(state)
    return {
      feature: selectLimitsLookup(state),
      selected: state.ui.selected,
      searched: deviceModel.searched, // debug make true
      canNavigate: state.backend.canNavigate,
      editTags: canEditTags(state, getActiveAccountId(state)),
    }
  })
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
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
        <RefreshButton size="md" color="grayDarker" />
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
          <ColumnsButton />
        </Route>
        {feature.tagging && editTags && (
          <>
            <Route path="/devices" exact>
              <IconButton to="/devices/select" icon="check-square" title="Show Select" />
            </Route>
            <Route path="/devices/select" exact>
              <IconButton to="/devices" icon="check-square" type="solid" color="primary" title="Hide Select" />
            </Route>
          </>
        )}
      </div>
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
    '& .MuiIconButton-root': { '-webkit-app-region': 'no-drag', zIndex: 1 },
  },
  search: {
    flexGrow: 1,
    zIndex: 1,
  },
  button: {
    '-webkit-app-region': 'no-drag',
    justifyContent: 'flex-start',
    minHeight: spacing.xxl,
  },
  selected: {
    marginRight: spacing.sm,
    marginLeft: spacing.sm,
  },
})
