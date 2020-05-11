import React, { useState } from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { colors, spacing, fontSizes } from '../../styling'
import { isElectron } from '../../services/Browser'
import { makeStyles } from '@material-ui/styles'
import * as screenfull from 'screenfull'
import * as assets from '../../assets'
import { Icon } from '../Icon'
import { Logo } from '../Logo'

export const RemoteHeader: React.FC<{ os?: Ios }> = ({ os }) => {
  const css = useStyles()
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled

  if (isElectron()) return null

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  return (
    <div className={css.remote}>
      {fullscreenEnabled && (
        <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
          <IconButton onClick={toggleFullscreen}>
            <Icon name={fullscreen ? 'compress' : 'expand'} size="md" />
          </IconButton>
        </Tooltip>
      )}
      {os && <img className={css.icon} src={assets[os]} alt={os} />}
      <Logo width={80} white />
    </div>
  )
}

const useStyles = makeStyles({
  remote: {
    color: colors.white,
    textAlign: 'center',
    '& button': { position: 'absolute', left: 0, top: 0, color: colors.white },
  },
  icon: {
    position: 'absolute',
    height: spacing.lg,
    right: spacing.md,
  },
})
