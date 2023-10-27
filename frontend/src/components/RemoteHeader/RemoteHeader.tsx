import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip, IconButton } from '@mui/material'
import { isMac, isRemote } from '../../services/Browser'
import { TargetPlatform } from '../TargetPlatform'
import { spacing } from '../../styling'
import { Icon } from '../Icon'
import { Logo } from '../Logo'
import classnames from 'classnames'
import screenfull from 'screenfull'

type Props = { device?: IDevice; color?: string; insets: ILayout['insets']; children: React.ReactNode }

export const RemoteHeader: React.FC<Props> = ({ device, color, insets, children }) => {
  const showFrame = isRemote()
  const showBorder = !isMac() && !showFrame
  const css = useStyles({ showBorder, insets })
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const fullscreenEnabled = screenfull.isEnabled

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (screenfull.isEnabled) screenfull.toggle()
  }

  let remoteCss = ''
  let pageCss = classnames(css.full, css.page)

  if (showFrame) {
    pageCss = classnames(pageCss, css.inset)
    remoteCss = classnames(css.full, css.default)
  }

  return (
    <div className={remoteCss} style={{ backgroundColor: color }}>
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
      <div className={pageCss}>{children}</div>
    </div>
  )
}

type styleProps = {
  insets: ILayout['insets']
  showBorder: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  full: ({ insets }: styleProps) => ({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'fixed',
    // for iOS mobile
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }),
  page: ({ showBorder }: styleProps) => ({
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    backgroundColor: palette.white.main,
    margin: 'auto',
    borderTop: showBorder ? `1px solid ${palette.grayLighter.main}` : undefined,
    contain: 'layout',
  }),
  inset: {
    top: spacing.xl,
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: spacing.sm,
  },
  default: { backgroundColor: palette.grayDarker.main, padding: spacing.xs },
  remote: {
    color: palette.white.main,
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
