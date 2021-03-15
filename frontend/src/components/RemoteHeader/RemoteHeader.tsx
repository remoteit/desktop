import React, { useState } from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { isElectron, isMac } from '../../services/Browser'
import { TargetPlatform } from '../TargetPlatform'
import { spacing, colors } from '../../styling'
import { Icon } from '../Icon'
import { Logo } from '../Logo'
import classnames from 'classnames'
import * as screenfull from 'screenfull'

type Props = { device?: IDevice; color?: string; children: React.ReactNode }

export const RemoteHeader: React.FC<Props> = ({ device, color, children }) => {
  const showFrame = !isElectron()
  const showBorder = !isMac() && !showFrame
  const css = useStyles(showBorder)()
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
              <IconButton onClick={toggleFullscreen}>
                <Icon name={fullscreen ? 'compress' : 'expand'} size="md" />
              </IconButton>
            </Tooltip>
          )}
          <span className={css.icon}>
            <TargetPlatform id={device?.targetPlatform} size="xl" tooltip />
          </span>
          <Logo width={80} margin="auto" white />
        </div>
      )}
      <div className={pageCss}>{children}</div>
    </div>
  )
}

const useStyles = showBorder =>
  makeStyles({
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
      backgroundColor: colors.white,
      margin: 'auto',
      borderTop: showBorder ? `1px solid ${colors.gray}` : undefined,
    },
    inset: {
      top: spacing.xl,
      left: spacing.sm,
      right: spacing.sm,
      bottom: spacing.sm,
      borderRadius: spacing.sm,
    },
    default: { backgroundColor: colors.grayDarker, padding: spacing.xs },
    remote: {
      color: colors.white,
      textAlign: 'center',
      '& button': { position: 'absolute', left: 0, top: 0, color: colors.white },
    },
    icon: {
      position: 'absolute',
      height: spacing.lg,
      right: spacing.md,
      top: spacing.xxs,
    },
  })
