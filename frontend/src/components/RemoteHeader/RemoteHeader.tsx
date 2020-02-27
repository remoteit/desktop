import React from 'react'
import { colors, spacing, fontSizes } from '../../styling'
import { isElectron } from '../../services/Platform'
import { makeStyles } from '@material-ui/styles'
import * as assets from '../../assets'

export const RemoteHeader: React.FC<{ os?: Ios }> = ({ os }) => {
  const css = useStyles()

  if (isElectron()) return null

  return (
    <div className={css.remote}>
      {os && <img className={css.icon} src={assets[os]} />}
      Remote View
    </div>
  )
}

const useStyles = makeStyles({
  remote: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 500,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: `${spacing.lg}px`,
  },
  icon: {
    position: 'absolute',
    height: spacing.lg,
    right: spacing.md,
  },
})
