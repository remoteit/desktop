import React from 'react'
import { Typography, Box } from '@mui/material'
import { spacing, fontSizes } from '../../styling'
import { Icon } from '../Icon'

export interface ReportSummaryBoxProps {
  iconTitle?: string
  count?: number
  label?: string
  icon?: string
  total?: number
  width?: number
}
export const ReportSummaryBox: React.FC<ReportSummaryBoxProps> = ({ count, label, icon, total, width }) => {
  return (
    <Box boxShadow={3} width={width}>
      <Box sx={{ color: 'white.main', backgroundColor: 'primary.main', display: 'flex' }}>
        <Box sx={{ padding: `${spacing.md}px ${spacing.xs}px ${spacing.md}px ${spacing.md}px`, flexGrow: 1 }}>
          <Typography sx={{ fontSize: fontSizes.xxl, color: 'white.main', padding: `${spacing.xxs} 0px` }}>
            {count}
          </Typography>
          <Typography sx={{ fontSize: fontSizes.md }}>
            {total ? `of ${total} ` : ''}
            {label}
          </Typography>
        </Box>
        <Box sx={{ padding: `${spacing.md}px ${spacing.md}px ${spacing.xs}px` }}>
          <Icon name={icon} size="max" />
        </Box>
      </Box>
    </Box>
  )
}
