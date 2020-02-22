import React, { useState } from 'react'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Platform'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import * as screenfull from 'screenfull'
import styles from '../../styling'

export const Header: React.FC = () => {
  const { device } = useSelector((state: ApplicationState) => state.backend)
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled
  const css = useStyles()

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  if (!isMac() && isElectron()) return null

  return (
    <div className={css.header}>
      <Typography>{device.name ? device.name : 'remote.it'}</Typography>
      {!isElectron() && fullscreenEnabled && (
        <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
          <IconButton onClick={toggleFullscreen}>
            <Icon name={fullscreen ? 'compress' : 'expand'} size="md" />
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}

const useStyles = makeStyles({
  header: {
    backgroundColor: styles.colors.white,
    padding: `${styles.spacing.xxs}px ${styles.spacing.sm}px`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 40,
    '-webkit-user-select': 'none',
    '-webkit-app-region': 'drag',
    '& img': {
      width: 120,
    },
    '& .MuiButtonBase-root': {
      position: 'absolute',
      left: styles.spacing.xs,
    },
    '& .MuiTypography-root': {
      color: styles.colors.grayDarker,
      textAlign: 'center',
      width: '100%',
    },
  },
})
