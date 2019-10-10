import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Tooltip } from '@material-ui/core'
import { colors, spacing, fontSizes } from '../../styling'

const OutOfBand: React.FC<{ active: boolean }> = ({ active }) => {
  const css = useStyles()
  return (
    <Tooltip title={active ? 'Mode active' : 'Mode inactive'}>
      <div className={css.oob + (active ? ' ' + css.active : '')}>
        <span />
        <small>Out of Band</small>
      </div>
    </Tooltip>
  )
}

export default OutOfBand

const useStyles = makeStyles({
  oob: {
    // border: `1px solid ${colors.grayLightest}`,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: spacing.sm,
    display: 'inline-flex',
    color: colors.gray,
    backgroundColor: colors.grayLightest,
    alignItems: 'center',
    '& small': {
      fontWeight: 400,
      fontSize: fontSizes.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  },
  active: {
    border: 0,
    backgroundColor: colors.primary,
    color: colors.white,
    '& span': {
      width: spacing.sm,
      height: spacing.sm,
      borderRadius: '50%',
      display: 'block',
      marginRight: spacing.md,
      backgroundColor: colors.white,
      boxShadow: `0 0 8px ${colors.white}`,
    },
  },
})
