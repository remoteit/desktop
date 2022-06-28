import React from 'react'
import { Typography, Box } from '@mui/material'
import { spacing, fontSizes } from '../../styling'
import { makeStyles } from '@mui/styles'
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
        <div className={css.textContent}>
          <Typography className={css.header}>{count}</Typography>
          <Typography className={css.descriptor}>
            {total ? `of ${total} ` : ''}
            {label}
          </Typography>
        </div>
        <div className={css.iconContainer}>
          <Icon name={icon} size="max" />
        </div>
      </div>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  report: {
    color: palette.white.main,
    backgroundColor: palette.primary.main,
    display: 'flex',
  },
  header: {
    fontSize: fontSizes.xxl,
    color: palette.white.main,
    padding: `${spacing.xxs} 0px`,
  },
  descriptor: {
    fontSize: fontSizes.md,
  },
  iconContainer: {
    padding: `${spacing.md}px ${spacing.md}px ${spacing.xs}px`,
  },
  textContent: {
    padding: `${spacing.md}px ${spacing.xs}px ${spacing.md}px ${spacing.md}px`,
    flexGrow: 1,
  },
}))
