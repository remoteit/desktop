import React from 'react'
import { checklist } from '../helpers/checklistHelper'
import { Box, Tooltip, Typography } from '@mui/material'
import { Icon } from './Icon'

type Props = { connection?: IConnection }

export const ConnectionChecklist: React.FC<Props> = ({ connection }) => {
  if (!connection?.checkpoint || connection.public || connection.connectLink) return null

  const keys = Object.keys(checklist)
  const anyFailed = keys.some(key => !checklist[key].hide?.(connection) && !connection.checkpoint?.[key])

  return (
    <Tooltip
      arrow
      placement="left-start"
      slotProps={{
        tooltip: {
          sx: {
            paddingLeft: 2,
            paddingRight: 2.5,
            paddingTop: 1.5,
            paddingBottom: 1.5,
            boxShadow: 1,
            backgroundColor: 'grayLightest.main',
            '& .MuiTooltip-arrow': { color: 'grayLightest.main' },
          },
        },
      }}
      title={keys.map(
        key =>
          !checklist[key].hide?.(connection) && (
            <Typography key={key} variant="body2" color="grayDarkest.main">
              {connection?.checkpoint?.[key] ? (
                <Icon name="check" color="success" type="solid" fixedWidth inlineLeft />
              ) : (
                <Icon name="times" color="danger" type="solid" fixedWidth inlineLeft />
              )}
              {checklist[key].title}
              <br />
            </Typography>
          )
      )}
    >
      <Box padding={1}>
        <Icon name={anyFailed ? 'times' : 'check'} color={anyFailed ? 'danger' : 'success'} size="md" />
      </Box>
    </Tooltip>
  )
}
