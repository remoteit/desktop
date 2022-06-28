import React from 'react'
import { Icon } from './Icon'
import { Quote } from './Quote'
import { Color } from '../styling'
import { Percent } from './Percent'
import { Round } from './Round'
import { Typography, Divider, Box } from '@mui/material'

export const QualityDetails: React.FC<{ device?: IDevice; small?: boolean }> = ({ device, small }) => {
  let title: string = 'Unknown'
  let color: Color = 'gray'

  if (!device) return null

  switch (device.quality) {
    case 'GOOD':
      title = 'Good'
      color = 'success'
      break
    case 'MODERATE':
      title = 'Moderate'
      color = 'warning'
      break
    case 'POOR':
      title = 'Poor'
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
          Availability: <Percent value={device.availability} />
        </Typography>
        <Typography variant="caption">Average time online per day.</Typography>
        <br />
        <br />
        <Typography variant="body2">
          Instability: <Round value={device.instability} />
        </Typography>
        <Typography variant="caption">Average number of disconnects per day.</Typography>
      </Quote>
    </Box>
  )
}
