import React, { useState } from 'react'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { FullscreenRounded, FullscreenExitRounded } from '@material-ui/icons'
import { IInterface } from '../common/types'
import { IUser } from 'remote.it'
import * as screenfull from 'screenfull'
import OutOfBand from './OutOfBand'
import logo from '../assets/logo.svg'
import styles from '../styling/styling'

const Header: React.FC<{ user: IUser; interfaces: IInterface[] }> = ({ user, interfaces }) => {
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled
  const css = useStyles()

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  return (
    <div className={css.header}>
      <img src={logo} alt="remote.it" />
      <Typography variant="caption">{user.username}</Typography>
      {fullscreenEnabled && (
        <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
          <IconButton onClick={toggleFullscreen}>
            {fullscreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
          </IconButton>
        </Tooltip>
      )}
      <div className={css.oob}>
        <OutOfBand active={interfaces.length > 1} />
      </div>
    </div>
  )
}

export default Header

const useStyles = makeStyles({
  header: {
    paddingTop: styles.spacing.md,
    paddingBottom: styles.spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    '& img': {
      width: 120,
    },
    '& .MuiTypography-caption': {
      flexGrow: 1,
      color: styles.colors.grayLight,
      textAlign: 'right',
      marginTop: 16,
      marginRight: styles.spacing.sm,
    },
  },
  oob: {
    marginTop: 10,
    marginLeft: 8,
  },
})
