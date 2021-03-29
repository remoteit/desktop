import React, { useEffect, useState } from 'react'
import { makeStyles, IconButton } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'
import { useNavigation } from '../../hooks/useNavigation'

export const Header: React.FC = () => {
  const { navigationBack, navigationForward } = useSelector((state: ApplicationState) => ({
    navigationBack: state.ui.navigationBack,
    navigationForward: state.ui.navigationForward,
  }))
  const { handleBack, handleForward } = useNavigation()
  const [hasFocus, setHasFocus] = useState<boolean>(true)
  const css = useStyles(hasFocus)()
  const [disabledForward, setDisabledForward] = useState<boolean>(false)
  const [disabledBack, setDisabledBack] = useState<boolean>(false)

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

  return (
    <div className={css.header}>
      <IconButton disabled={disabledBack} onClick={handleBack}>
        <Icon name="chevron-left" size="lg" color={disabledBack ? 'grayLight' : 'grayDark'} />
      </IconButton>
      <IconButton disabled={disabledForward} onClick={handleForward}>
        <Icon name="chevron-right" size="lg" color={disabledForward ? 'grayLight' : 'grayDark'} />
      </IconButton>
      <Typography variant="body2" color="textSecondary">
        {device ? attributeName(device) : 'remote.it'}
      </Typography>
    </div>
  )
}

const useStyles = hasFocus =>
  makeStyles({
    header: {
      display: 'flex',
      padding: `${styles.spacing.xs}px ${styles.spacing.md}px`,
      paddingTop: styles.spacing.xs,
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: 40,
      width: '100%',
      opacity: hasFocus ? 1 : 0.2,
      // pointerEvents: 'none',
      // '-webkit-text-selection': 'none',
      '& .MuiTypography-root': { marginLeft: styles.spacing.md, fontWeight: 500 },
      '& .MuiIconButton-root': { '-webkit-app-region': 'no-drag', zIndex: 1 },
    },
  })
