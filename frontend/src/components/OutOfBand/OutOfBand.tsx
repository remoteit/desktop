import React from 'react'
import { isMac, isWindows } from '../../services/Platform'
import { makeStyles } from '@material-ui/styles'
import { Tooltip } from '@material-ui/core'
import { colors, spacing, fontSizes } from '../../styling'

export const OutOfBand: React.FC<{ active: boolean }> = ({ active }) => {
  const css = useStyles()
  if (isMac() || isWindows()) return null
  return (
    <Tooltip title={active ? 'Mode active' : 'Mode inactive'}>
      <div className={css.oob + (active ? ' ' + css.active : '')}>
        <span />
        <small>Out of Band</small>
      </div>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  oob: {
    border: `1px solid ${colors.grayLight}`,
    padding: `${spacing.xxs}px ${spacing.sm}px`,
    borderRadius: spacing.xs,
    display: 'inline-flex',
    color: colors.gray,
    alignItems: 'center',
    '& small': {
      fontWeight: 400,
      fontSize: fontSizes.xxs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    '& span': {
      width: spacing.xs,
      height: spacing.xs,
      borderRadius: '50%',
      display: 'block',
      marginRight: spacing.xs,
      backgroundColor: colors.grayLight,
    },
  },
  active: {
    border: 0,
    backgroundColor: colors.primary,
    color: colors.white,
    '& small': {
      fontWeight: 500,
    },
    '& span': {
      backgroundColor: colors.white,
      boxShadow: `0 0 8px ${colors.white}`,
    },
  },
})
