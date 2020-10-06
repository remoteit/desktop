import React from 'react'
import { Typography } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { getOwnDevices } from '../../models/accounts'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { attributeName } from '../../shared/nameHelper'
import styles from '../../styling'

export const Header: React.FC = () => {
  const css = useStyles()
  const { email, device } = useSelector((state: ApplicationState) => ({
    email: false, //state.auth.user?.email,
    device: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
  }))

  if (!isMac() && isElectron()) return null

  return (
    <div className={css.header}>
      <Typography variant="body2">
        {device ? attributeName(device) : 'remote.it'} {email && <span className={css.email}>- {email}</span>}
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
  email: {
    color: styles.colors.gray,
  },
})
