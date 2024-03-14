import React, { useState } from 'react'
import { APP_MAX_WIDTH } from '../constants'
import { makeStyles } from '@mui/styles'
import { Tooltip, IconButton, useMediaQuery } from '@mui/material'
import { TargetPlatform } from './TargetPlatform'
import { spacing } from '../styling'
import { Icon } from './Icon'
import { Logo } from './Logo'
import screenfull from 'screenfull'
import browser from '../services/Browser'

type Props = { device?: IDevice; children: React.ReactNode }

export const RemoteHeader: React.FC<Props> = ({ device, children }) => {
  const maxWidth = useMediaQuery(`(min-width:${APP_MAX_WIDTH}px)`)
  const showFrame = browser.isRemote || maxWidth
  const css = useStyles({ showFrame })
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  return (
    <div className={css.full}>
      {showFrame && (
        <div className={css.remote}>
          {browser.isRemote && (
            <>
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
            </>
          )}
          <Logo width={80} margin="auto" color="gray" />
        </div>
      )}
      <div className={css.page}>{children}</div>
    </div>
  )
}

type styleProps = {
  showFrame: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  full: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'fixed',
    backgroundColor: palette.grayLightest.main,
  },
  page: ({ showFrame }: styleProps) => ({
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    margin: 'auto',
    contain: 'layout',
    height: `calc(100%${showFrame ? ` - ${spacing.xxl}px` : ''})`,
    width: `calc(100%${showFrame ? ` - ${spacing.lg}px` : ''})`,
    maxWidth: APP_MAX_WIDTH,
    backgroundColor: palette.white.main,
    borderRadius: showFrame ? spacing.lg : undefined,
    boxShadow: showFrame ? `0 1px 3px ${palette.shadow.main}` : undefined,
  }),
  remote: {
    height: spacing.xl,
    display: 'flex',
    color: palette.grayLight.main,
    textAlign: 'center',
    '& button': { position: 'absolute', left: 0, top: 0, color: palette.white.main },
  },
  icon: {
    position: 'absolute',
    height: spacing.lg,
    right: spacing.md,
    top: spacing.xs,
  },
}))
