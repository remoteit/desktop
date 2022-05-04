import React from 'react'
import { Application } from '../shared/applications'
import { ListItem, ListItemIcon, makeStyles, MenuItem, TextField } from '@material-ui/core'
import { newConnection } from '../helpers/connectionHelper'
import { Icon } from './Icon'

type Props = {
  app: Application
  service?: IService
  connection?: IConnection
  onChange: (launchType: string) => void
}

export const LaunchTypeSelect: React.FC<Props> = ({ app, service, connection, onChange }) => {
  if (!connection) connection = newConnection(service)

  const [open, setOpen] = React.useState<boolean>(false)
  const css = useStyles()

  const handleClick = () => setOpen(!open)

  return (
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
        onChange={e => {
          handleClick()
          onChange && onChange(e.target.value)
        }}
      >
        <MenuItem value="URL">URL</MenuItem>
        <MenuItem value="COMMAND">Command</MenuItem>
      </TextField>
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  field: {
    '&:hover': { backgroundColor: palette.primaryHighlight.main },
  },
}))
