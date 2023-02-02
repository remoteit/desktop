import React from 'react'
import { makeStyles } from '@mui/styles'
import { checklist } from '../helpers/checklistHelper'
import { Box, Tooltip, Typography } from '@mui/material'
import { Icon } from './Icon'

type Props = { connection?: IConnection }

export const ConnectionChecklist: React.FC<Props> = ({ connection }) => {
  const css = useStyles({})

  if (!connection?.checkpoint || connection.public || connection.connectLink) return null

  const keys = Object.keys(checklist)
  const anyFailed = keys.some(key => !checklist[key].hide?.(connection) && !connection.checkpoint?.[key])

  return (
    <Tooltip
      arrow
      placement="left-start"
      classes={{ tooltip: css.tooltip }}
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

const useStyles = makeStyles(({ palette, spacing, shadows }) => ({
  tooltip: {
    paddingLeft: spacing(2),
    paddingRight: spacing(2.5),
    paddingTop: spacing(1.5),
    paddingBottom: spacing(1.5),
    boxShadow: shadows[1],
    backgroundColor: palette.grayLightest.main,
    '& .MuiTooltip-arrow': { color: palette.grayLightest.main },
  },
}))
