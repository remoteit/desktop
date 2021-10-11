import React from 'react'
import { Box, ListItem, ListItemIcon, makeStyles, MenuItem, TextField, Tooltip } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { CustomAttributeSettings } from '../CustomAttributeSettings'
import { InlineTemplateSetting } from '../InlineTemplateSetting'
import { colors, spacing } from '../../styling'
import { useApplication } from '../../hooks/useApplication'
import { Quote } from '../Quote'
import { Icon } from '../Icon'

type Props = {
  service: IService
  connection: IConnection
  disabled?: boolean
}

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
    <>
      <ListItem dense className={css.field}>
        <ListItemIcon>
          <Icon name={app.icon} size="md" />
        </ListItemIcon>
        <TextField
          select
          fullWidth
          size="small"
          label="Launch type"
          value={app.launchType}
          onChange={e => onChange(e.target.value)}
        >
          <MenuItem value="URL">URL</MenuItem>
          <MenuItem value="COMMAND">Command</MenuItem>
        </TextField>
      </ListItem>
      <ListItem dense>
        <ListItemIcon></ListItemIcon>
        <Quote margin={0}>
          <InlineTemplateSetting
            connection={connection}
            service={service}
            context={connection.launchType === 'COMMAND' ? 'copy' : 'launch'}
          />
          {/* <InlineTextFieldSetting
            hideIcon
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
          <CustomAttributeSettings connection={connection} service={service} /> */}
        </Quote>
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  menu: { textTransform: 'capitalize' },
  field: {
    '&:hover': { backgroundColor: colors.primaryHighlight },
    /*  marginRight: spacing.sm, '& .MuiListItemSecondaryAction-root': { display: 'none' } */
  },
})
