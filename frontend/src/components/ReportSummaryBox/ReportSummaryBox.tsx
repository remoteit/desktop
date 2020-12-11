import React, { useState } from 'react'
import { Tooltip } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import * as assets from '../../assets'
import { Icon } from '../Icon'

export interface RemoteSummaryBoxProps {
  count?: number
  label?: string
  icon?: string
}
export const RemoteSummaryBox: React.FC<RemoteSummaryBoxProps> = ({ count, label, icon }) => {
  const css = useStyles()
  return (
    <div className={css.remote}>
      {label}
      {count}
      <Icon title="" name="hdd" />
    </div>
  )
}

const useStyles = makeStyles({
  remote: {
    color: colors.white,
    backgroundColor: colors.primary,
  },
  icon: {
    position: 'absolute',
    height: spacing.lg,
    right: spacing.md,
  },
})
