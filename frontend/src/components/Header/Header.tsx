import React, { useEffect, useState, useRef } from 'react'
import { makeStyles, IconButton, Collapse } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { usePanelWidth } from '../../hooks/usePanelWidth'
import { useNavigation } from '../../hooks/useNavigation'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { GlobalSearch } from '../GlobalSearch'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

export const Header: React.FC = () => {
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
    <>
      <Collapse in={!showSearch && !searched} timeout={300}>
        <div className={css.header}>
          <IconButton disabled={disabledBack} onClick={handleBack}>
            <Icon name="chevron-left" size="lg" color={disabledBack ? 'grayLight' : 'grayDark'} />
          </IconButton>
          <IconButton disabled={disabledForward} onClick={handleForward}>
            <Icon name="chevron-right" size="lg" color={disabledForward ? 'grayLight' : 'grayDark'} />
          </IconButton>
          <IconButton
            onClick={() => {
              setShowSearch(true)
              setTimeout(() => inputRef.current?.focus(), 300)
            }}
          >
            <Icon name="search" size="lg" />
            <Typography variant="body2" color="textSecondary">
              {device ? attributeName(device) : 'remote.it'}
            </Typography>
          </IconButton>
        </div>
      </Collapse>
      <Collapse in={!!showSearch || searched} timeout={300}>
        <div className={css.header}>
          <GlobalSearch inputRef={inputRef} onClose={() => setShowSearch(false)} />
        </div>
      </Collapse>
    </>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    padding: `${styles.spacing.md}px ${styles.spacing.md}px`,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 40,
    width: '100%',
    opacity: ({ hasFocus }: any) => (hasFocus ? 1 : 0.2),
    // pointerEvents: 'none',
    // '-webkit-text-selection': 'none',
    '& .MuiTypography-root': { marginLeft: styles.spacing.md, fontWeight: 500 },
    '& .MuiIconButton-root': { '-webkit-app-region': 'no-drag', zIndex: 1 },
  },
})
