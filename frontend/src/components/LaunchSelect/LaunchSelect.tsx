import React from 'react'
import { Box, ListItem, ListItemIcon, makeStyles, MenuItem, TextField, Tooltip } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { colors, spacing } from '../../styling'
import { useApplication } from '../../hooks/useApplication'
import { Quote } from '../Quote'
import { Icon } from '../Icon'

type Props = {
  service: IService
  connection: IConnection
  disabled?: boolean
}

const ITEM = [
  { id: 0, label: 'Use command' },
  { id: 1, label: 'Use URL' },
]

export const LaunchSelect: React.FC<Props> = ({ service, connection }) => {
  if (!connection) connection = newConnection(service)

  const appCommand = useApplication('copy', service, connection)
  const appUrl = useApplication('launch', service, connection)
  const css = useStyles()

  const app = connection.launchType === 'COMMAND' ? appCommand : appUrl

  const onSave = template => {
    connection &&
      setConnection({
        ...connection,
        [app.templateKey]: template.toString(),
      })
  }

  const onChange = (value: any) => {
    connection &&
      setConnection({
        ...connection,
        launchType: value.toString(),
      })
  }

  return (
    <Box marginBottom={2}>
      <ListItem dense>
        <ListItemIcon>
          <Icon name={app.icon} size="md" />
        </ListItemIcon>
        <TextField
          select
          className={css.field}
          label="Launch type"
          value={connection.launchType}
          variant="filled"
          onChange={e => onChange(e.target.value)}
        >
          {ITEM.map(item => {
            return (
              <MenuItem value={item.label} key={item.id}>
                {item.label}
              </MenuItem>
            )
          })}
        </TextField>
      </ListItem>
      <ListItem dense>
        <ListItemIcon></ListItemIcon>
        <Quote margin={0}>
          <InlineTextFieldSetting
            hideIcon={true}
            label={
              <>
                {app.contextTitle}
                <Tooltip title={`Replacement tokens: ${app.allTokens.join(', ')}`} placement="top" arrow>
                  <span style={{ zIndex: 10 }}>
                    <Icon name="question-circle" size="sm" type="regular" inline />
                  </span>
                </Tooltip>
              </>
            }
            value={app.command}
            resetValue={app.command}
            onSave={template => onSave(template)}
          />
        </Quote>
      </ListItem>
    </Box>
  )
}

const useStyles = makeStyles({
  field: { width: 200, marginRight: spacing.sm, '& .MuiListItemSecondaryAction-root': { display: 'none' } },
  divider: { marginTop: spacing.xxs, marginBottom: spacing.xxs },
  action: { right: spacing.xs, marginLeft: spacing.sm },
})
