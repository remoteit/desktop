import React from 'react'
import { List, ListItem, ListItemIcon, makeStyles, MenuItem, TextField } from '@material-ui/core'
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

  const [open, setOpen] = React.useState<boolean>(false)
  const app = useApplication('launch', service, connection)
  const css = useStyles()

  connection.context = app.launchType === 'COMMAND' ? 'copy' : 'launch'

  const handleChange = (value: any) => {
    handleClick()
    connection &&
      setConnection({
        ...connection,
        launchType: value.toString(),
      })
  }

  const handleClick = () => setOpen(!open)

  return (
    <>
      <ListItem dense className={css.field} onClick={handleClick} button>
        <ListItemIcon>
          <Icon name={app.icon} size="md" />
        </ListItemIcon>
        <TextField
          select
          fullWidth
          SelectProps={{ open }}
          size="small"
          label="Launch type"
          value={app.launchType}
          onChange={e => handleChange(e.target.value)}
        >
          <MenuItem value="URL">URL</MenuItem>
          <MenuItem value="COMMAND">Command</MenuItem>
        </TextField>
      </ListItem>
      <ListItem dense>
        <ListItemIcon></ListItemIcon>
        <Quote margin={0} noInset>
          <List disablePadding>
            <InlineTemplateSetting
              connection={connection}
              service={service}
              context={app.launchType === 'COMMAND' ? 'copy' : 'launch'}
            />
            <CustomAttributeSettings connection={connection} service={service} />
          </List>
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
