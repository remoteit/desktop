import React, { useEffect, useState, useRef } from 'react'
import { makeStyles, Collapse } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useNavigation } from '../../hooks/useNavigation'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { GlobalSearch } from '../GlobalSearch'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { SearchedNotice } from '../SearchedNotice'
import { RegisterButton } from '../../buttons/RegisterButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { AccountSelect } from '../AccountSelect'
import { FilterButton } from '../../buttons/FilterButton'
import { IconButton } from '../../buttons/IconButton'
import { TestUI } from '../TestUI'
import { Title } from '../Title'
import { Route } from 'react-router-dom'
import styles from '../../styling'

export const Header: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { searched, navigationBack, navigationForward } = useSelector((state: ApplicationState) => ({
    searched: state.devices.searched,
    navigationBack: state.ui.navigationBack,
    navigationForward: state.ui.navigationForward,
  }))
  const { handleBack, handleForward } = useNavigation()
  const [hasFocus, setHasFocus] = useState<boolean>(true)
  const [disabledForward, setDisabledForward] = useState<boolean>(false)
  const [disabledBack, setDisabledBack] = useState<boolean>(false)
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const css = useStyles({ hasFocus })

  const { device } = useSelector((state: ApplicationState) => ({
    device: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
  }))

  const focus = () => setHasFocus(true)
  const blur = () => setHasFocus(false)

  useEffect(() => {
    window.addEventListener('focus', focus)
    window.addEventListener('blur', blur)
    return function cleanup() {
      window.removeEventListener('focus', focus)
      window.removeEventListener('blur', blur)
    }
  })

  useEffect(() => {
    setDisabledBack(!(navigationBack?.length > 1))
    setDisabledForward(!navigationForward?.length)
  }, [navigationBack, navigationForward])

  console.log(`show:${showSearch.toString()} searched:${searched.toString()}`)
  return (
    <div className={css.header}>
      <IconButton
        disabled={disabledBack}
        onClick={handleBack}
        icon="chevron-left"
        size="lg"
        color={disabledBack ? 'grayLight' : 'grayDark'}
      />
      <IconButton
        disabled={disabledForward}
        onClick={handleForward}
        icon="chevron-right"
        size="lg"
        color={disabledForward ? 'grayLight' : 'grayDark'}
      />
      <Title className={css.search}>
        {!showSearch && !searched && (
          <IconButton
            icon="search"
            size="lg"
            onClick={() => {
              setShowSearch(true)
              setTimeout(() => inputRef.current?.focus(), 20)
            }}
          >
            <Typography variant="body2" color="textSecondary">
              {device ? attributeName(device) : 'remote.it'}
            </Typography>
          </IconButton>
        )}
        {(!!showSearch || searched) && <GlobalSearch inputRef={inputRef} onClose={() => setShowSearch(false)} />}
      </Title>
      <Route path="/devices" exact>
        {singlePanel && (
          <>
            <AccountSelect />
            <RegisterButton />
            <RefreshButton />
          </>
        )}
        <FilterButton />
        <TestUI>
          <ColumnsButton />
        </TestUI>
        <TestUI>
          <IconButton to="/devices/select" icon="check-square" title="Multi-select" />
        </TestUI>
      </Route>
    </div>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    padding: `${styles.spacing.md}px ${styles.spacing.md}px`,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 50,
    width: '100%',
    opacity: ({ hasFocus }: any) => (hasFocus ? 1 : 0.2),
    // pointerEvents: 'none',
    // '-webkit-text-selection': 'none',
    '& .MuiTypography-root': { marginLeft: styles.spacing.md, fontWeight: 500 },
    '& .MuiIconButton-root': { '-webkit-app-region': 'no-drag', zIndex: 1 },
  },
  search: {
    cursor: 'pointer',
    '-webkit-app-region': 'no-drag',
    flexGrow: 1,
    zIndex: 1,
  },
})
