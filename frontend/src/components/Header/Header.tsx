import React from 'react'
import { Typography } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { ApplicationState } from '../../store'
import { usePermissions } from '../../hooks/usePermissions'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { deviceName } from '../../shared/nameHelper'
import styles from '../../styling'

export const Header: React.FC = () => {
  const device = useSelector((state: ApplicationState) =>
    state.devices.all.find(d => d.id === state.backend.device.uid)
  )
  const { guest } = usePermissions()
  const css = useStyles()

  if (!isMac() && isElectron()) return null

  return (
    <div className={css.header}>
      <Typography variant="body2">
        {device ? deviceName(device) : 'remote.it'} {guest && <span className={css.guest}>- Guest</span>}
      </Typography>
    </div>
  )
}

const useStyles = makeStyles({
  header: {
    position: 'relative',
    backgroundColor: styles.colors.white,
    padding: `${styles.spacing.xxs}px ${styles.spacing.sm}px`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 40,
    '-webkit-user-select': 'none',
    '-webkit-app-region': 'drag',
    '& img': { width: 120 },
    '& .MuiButtonBase-root': {
      position: 'absolute',
      left: styles.spacing.xs,
    },
    '& .MuiTypography-root': {
      color: styles.colors.grayDark,
      textAlign: 'center',
      width: '100%',
      margin: 0,
    },
  },
  guest: {
    color: styles.colors.primary,
  },
})
