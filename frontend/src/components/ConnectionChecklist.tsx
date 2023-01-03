import React from 'react'
import { makeStyles } from '@mui/styles'
import { checklist } from '../helpers/checklistHelper'
import { ButtonBase, Tooltip, Typography } from '@mui/material'
import { Icon } from './Icon'

type Props = { connection?: IConnection }

export const ConnectionChecklist: React.FC<Props> = ({ connection }) => {
  const css = useStyles({})

  if (!connection?.checkpoint) return null

  const keys = Object.keys(checklist)
  const anyFailed = keys.some(key => !checklist[key].hide?.(connection) && !connection.checkpoint?.[key])

  return (
    <Tooltip
      arrow
      placement="left"
      classes={{ tooltip: css.tooltip }}
      title={keys.map(
        key =>
          !checklist[key].hide?.(connection) && (
            <Typography key={key} variant="body2">
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
      <ButtonBase>
        <Icon name={anyFailed ? 'times' : 'check'} color={anyFailed ? 'danger' : 'success'} size="md" />
      </ButtonBase>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  tooltip: ({ color }: any) => ({
    paddingLeft: spacing(2),
    paddingRight: spacing(2.5),
    paddingTop: spacing(1.5),
    paddingBottom: spacing(1.5),
    backgroundColor: palette.grayLightest.main,
    '& .MuiTooltip-arrow': { color: palette.grayLightest.main },
  }),
}))
