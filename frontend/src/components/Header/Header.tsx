import React, { useEffect, useState, useRef } from 'react'
import { makeStyles, useMediaQuery } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography } from '@material-ui/core'
import { useNavigation } from '../../hooks/useNavigation'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { GlobalSearch } from '../GlobalSearch'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { FilterButton } from '../../buttons/FilterButton'
import { Breadcrumbs } from '../Breadcrumbs'
import { IconButton } from '../../buttons/IconButton'
import { Title } from '../Title'
import { Route } from 'react-router-dom'
import { spacing } from '../../styling'

export const Header: React.FC<{ breadcrumbs?: boolean }> = ({ breadcrumbs }) => {
  const { searched, navigationBack, navigationForward, feature, device } = useSelector((state: ApplicationState) => ({
    feature: state.ui.feature,
    selected: state.ui.selected,
    searched: state.devices.searched,
    navigationBack: state.ui.navigationBack,
    navigationForward: state.ui.navigationForward,
    device: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
  }))
  const { handleBack, handleForward } = useNavigation()
  const [disabledForward, setDisabledForward] = useState<boolean>(false)
  const [disabledBack, setDisabledBack] = useState<boolean>(false)
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const hideSidebar = useMediaQuery('(max-width:1200px)')
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    setDisabledBack(!(navigationBack?.length > 1))
    setDisabledForward(!navigationForward?.length)
  }, [navigationBack, navigationForward])

  return (
    <div className={css.header}>
      {hideSidebar && (
        <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
      )}
      {showSearch || searched || (
        <>
          <IconButton
            title="Back"
            disabled={disabledBack}
            onClick={handleBack}
            icon="chevron-left"
            size="md"
            color={disabledBack ? 'grayLight' : 'grayDarker'}
          />
          <IconButton
            title="Forward"
            disabled={disabledForward}
            onClick={handleForward}
            icon="chevron-right"
            size="md"
            color={disabledForward ? 'grayLight' : 'grayDarker'}
          />
        </>
      )}
      <RefreshButton size="base" type="regular" color="grayDarker" />
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
          >
            {device && (
              <Typography variant="caption" color="textSecondary">
                {attributeName(device)}
              </Typography>
            )}
          </IconButton>
        )}
        {(!!showSearch || searched) && <GlobalSearch inputRef={inputRef} onClose={() => setShowSearch(false)} />}
      </Title>
      {breadcrumbs && (
        <>
          bread
          <Breadcrumbs />
        </>
      )}
      <Route path={['/devices', '/devices/select']} exact>
        <FilterButton />
        <ColumnsButton />
      </Route>
      {feature.tagging && (
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
    zIndex: 8,
    // pointerEvents: 'none',
    // '-webkit-text-selection': 'none',
    '& .MuiIconButton-root': { '-webkit-app-region': 'no-drag', zIndex: 1 },
  },
  search: {
    '-webkit-app-region': 'no-drag',
    flexGrow: 1,
    zIndex: 1,
  },
  button: {
    justifyContent: 'flex-start',
    minHeight: spacing.xxl,
  },
  selected: {
    marginRight: spacing.sm,
    marginLeft: spacing.sm,
  },
})
