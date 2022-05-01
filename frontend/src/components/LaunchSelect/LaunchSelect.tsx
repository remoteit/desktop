import React from 'react'
import { List, ListItem, ListItemIcon, makeStyles, MenuItem, TextField } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { CustomAttributeSettings } from '../CustomAttributeSettings'
import { InlineTemplateSetting } from '../InlineTemplateSetting'
import { AutoLaunchToggle } from '../AutoLaunchToggle'
import { useApplication } from '../../hooks/useApplication'
import { spacing } from '../../styling'
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
  const app = useApplication(service, connection)
  const css = useStyles()

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
          <Icon name={app.icon} size="md" modified={app.template !== app.defaultTemplate} fixedWidth />
        </ListItemIcon>
        <TextField
          select
          fullWidth
          SelectProps={{ open }}
          label="Launch type"
          value={app.launchType}
          onChange={e => handleChange(e.target.value)}
        >
          <MenuItem value="URL">URL</MenuItem>
          <MenuItem value="COMMAND">Command</MenuItem>
        </TextField>
      </ListItem>
      <ListItem dense>
        <Quote margin={null} noInset listItem>
          <List className={css.indent} disablePadding>
            <AutoLaunchToggle connection={connection} service={service} />
            <InlineTemplateSetting app={app} connection={connection} service={service} />
            <CustomAttributeSettings app={app} connection={connection} service={service} />
          </List>
        </Quote>
      </ListItem>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  menu: { textTransform: 'capitalize' },
  indent: { marginRight: -spacing.lg },
  field: { '&:hover': { backgroundColor: palette.primaryHighlight.main } },
}))
