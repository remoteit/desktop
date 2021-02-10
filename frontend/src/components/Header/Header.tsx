import React, { useEffect, useState } from 'react'
import { ApplicationState } from '../../store'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { isElectron } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import styles from '../../styling'

export const Header: React.FC<{ menuOverlaps?: boolean }> = ({ menuOverlaps }) => {
  const { device } = useSelector((state: ApplicationState) => ({
    device: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
  }))

  const [hasFocus, setHasFocus] = useState<boolean>(true)
  const css = useStyles(hasFocus, menuOverlaps && isElectron())()

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

  return (
    <div className={css.header}>
      <Typography variant="body2">{device ? attributeName(device) : 'remote.it'}</Typography>
    </div>
  )
}

const useStyles = (hasFocus, moveMenu) =>
  makeStyles({
    header: {
      padding: `${styles.spacing.xxs}px ${styles.spacing.md}px`,
      marginTop: moveMenu ? 30 : 0,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: 40,
      position: 'relative',
      width: '100%',
      '-webkit-user-select': 'none',
      '-webkit-app-region': 'drag',
      '& .MuiTypography-root': {
        color: hasFocus ? styles.colors.grayDark : styles.colors.grayLight,
      },
    },
  })
