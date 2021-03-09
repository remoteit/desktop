import React, { useEffect, useState } from 'react'
import { makeStyles, IconButton } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Typography } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

export const Header: React.FC = () => {
  const [hasFocus, setHasFocus] = useState<boolean>(true)
  const history = useHistory()
  const css = useStyles(hasFocus)()
  const [back, setBack] = useState('')
  const [fordWare, setFordWare] = useState('')
  const [disabledForward, setDisabledForward] = useState<boolean>(false)
  const [disabledGoback, setDisabledGoback] = useState<boolean>(false)

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

  const goBack = () => {
    if (document.location.href === back) {
      setDisabledGoback(true)
    }
    setBack(document.location.href)
    history.goBack()
  }

  const goForward = () => {
    if (document.location.href === fordWare) {
      setDisabledForward(true)
    }
    setFordWare(document.location.href)
    history.goForward()
  }

  return (
    <div className={css.header}>
      <IconButton disabled={disabledGoback} onClick={goBack}>
        <Icon name="chevron-left" size="lg" color="grayDark" />
      </IconButton>
      <IconButton disabled={disabledForward} onClick={goForward}>
        <Icon name="chevron-right" size="lg" color="grayDark" />
      </IconButton>
      <Typography variant="body2" color="textSecondary">
        {device ? attributeName(device) : 'remote.it'}
        {/*  <Breadcrumbs /> */}
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
      '& .MuiTypography-root': { marginLeft: styles.spacing.md },
      '& .MuiIconButton-root': { '-webkit-app-region': 'no-drag', zIndex: 1 },
    },
  })
