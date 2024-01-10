import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip, IconButton } from '@mui/material'
import { TargetPlatform } from '../TargetPlatform'
import { spacing } from '../../styling'
import { Icon } from '../Icon'
import { Logo } from '../Logo'
import classnames from 'classnames'
import screenfull from 'screenfull'
import browser from '../../services/Browser'

type Props = { device?: IDevice; color?: string; children: React.ReactNode }

export const RemoteHeader: React.FC<Props> = ({ device, color, children }) => {
  const showFrame = browser.isRemote
  const css = useStyles({ color })
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  let remoteCss = ''
  let pageCss = classnames(css.full, css.page)

  if (showFrame) {
    pageCss = classnames(css.page, css.inset)
    remoteCss = classnames(css.full, css.default)
  }

  const page = <div className={pageCss}>{children}</div>

  if (!remoteCss && !showFrame) return page

  return (
    <div className={remoteCss}>
      {showFrame && (
        <div className={css.remote}>
          {fullscreenEnabled && (
            <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'} arrow>
              <IconButton onClick={toggleFullscreen} size="large">
                <Icon name={fullscreen ? 'compress' : 'expand'} size="md" />
              </IconButton>
            </Tooltip>
          )}
          <span className={css.icon}>
            <TargetPlatform id={device?.targetPlatform} size="lg" tooltip />
          </span>
          <Logo width={80} margin="auto" color="white" />
        </div>
      )}
      {page}
    </div>
  )
}

type styleProps = {
  color?: string
}

const useStyles = makeStyles(({ palette }) => ({
  full: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'fixed',
  },
  page: {
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    backgroundColor: palette.white.main,
    margin: 'auto',
    contain: 'layout',
  },
  inset: {
    top: spacing.xl,
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    position: 'fixed',
    borderRadius: spacing.lg,
  },
  default: { backgroundColor: palette.grayDarker.main, padding: spacing.xs },
  remote: ({ color }: styleProps) => ({
    color: color || palette.white.main,
    textAlign: 'center',
    '& button': { position: 'absolute', left: 0, top: 0, color: palette.white.main },
  }),
  icon: {
    position: 'absolute',
    height: spacing.lg,
    right: spacing.md,
    top: spacing.xs,
  },
}))
