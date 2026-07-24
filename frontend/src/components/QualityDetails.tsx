import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'
import { Quote } from './Quote'
import { Percent } from './Percent'
import { Round } from './Round'
import { Typography, Divider, Box } from '@mui/material'

export const QualityDetails: React.FC<{ device?: IDevice; small?: boolean }> = ({ device, small }) => {
  const { t } = useTranslation()
  let title: string = t('qualityDetails.unknown', 'Unknown')
  let color: Color = 'gray'

  if (!device) return null

  switch (device.quality) {
    case 'GOOD':
      title = t('qualityDetails.good', 'Good')
      color = 'success'
      break
    case 'MODERATE':
      title = t('qualityDetails.moderate', 'Moderate')
      color = 'warning'
      break
    case 'POOR':
      title = t('qualityDetails.poor', 'Poor')
      color = 'danger'
      break
  }

  const icon = (
    <>
      <Icon name="circle" color={color} size="bug" type="solid" inlineLeft /> {title}
    </>
  )
  if (small) return icon

  return (
    <Box>
      {icon}
      <Quote>
        <Divider orientation="vertical" />
        <Typography variant="body2">
          {t('qualityDetails.availability', 'Availability:')} <Percent value={device.availability} />
        </Typography>
        <Typography variant="caption">{t('qualityDetails.availabilityCaption', 'Average time online per day.')}</Typography>
        <br />
        <br />
        <Typography variant="body2">
          {t('qualityDetails.instability', 'Instability:')} <Round value={device.instability} />
        </Typography>
        <Typography variant="caption">
          {t('qualityDetails.instabilityCaption', 'Average number of disconnects per day.')}
        </Typography>
      </Quote>
    </Box>
  )
}
