import React from 'react'
import { Typography, Box } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'

export interface ReportSummaryBoxProps {
  iconTitle?: string
  count?: number
  label?: string
  icon?: string
  total?: number
  width?: number
}
export const ReportSummaryBox: React.FC<ReportSummaryBoxProps> = ({ iconTitle, count, label, icon, total, width }) => {
  const css = useStyles()
  return (
    <Box boxShadow={3} width={width}>
      <div className={css.report}>
        <Icon title={iconTitle} name={icon} size="xxl" />
        <div>
          <Typography variant="h1" className={css.report}>
            {count}
          </Typography>
          {total ? `of ${total}` : ''}
          {label}
        </div>
      </div>
    </Box>
  )
}

const useStyles = makeStyles({
  report: {
    color: colors.white,
    backgroundColor: colors.primary,
  },
  icon: {
    position: 'absolute',
    height: spacing.lg,
    right: spacing.md,
  },
})
