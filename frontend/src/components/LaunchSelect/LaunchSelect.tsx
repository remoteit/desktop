import React, { useEffect } from 'react'
import { List, ListItem, ListItemIcon, makeStyles, MenuItem, TextField } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { CustomAttributeSettings } from '../CustomAttributeSettings'
import { InlineTemplateSetting } from '../InlineTemplateSetting'
import { colors } from '../../styling'
import { useApplication } from '../../hooks/useApplication'
import { Quote } from '../Quote'
import { Icon } from '../Icon'
import { isElectron } from '../../services/Browser'

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
  const LAUNCH_TYPE: ILaunchType = { url: 'URL', command: 'COMMAND' }

  connection.context = app.launchType === LAUNCH_TYPE.command ? 'copy' : 'launch'

  useEffect(() => {
    if (isElectron() && app.launchType !== LAUNCH_TYPE.url) {
      connection &&
        setConnection({
          ...connection,
          launchType: LAUNCH_TYPE.url,
        })
    }
  }, [])

  const handleChange = (value: any) => {
    handleClick()
    connection &&
      setConnection({
        ...connection,
        launchType: value.toString(),
      })
  }

  const handleClick = () => setOpen(!open)

  let inputProps = {
    select: true,
    disabled: false
  };

  if (!isElectron()) {
    inputProps.select = false
    inputProps.disabled = true
  }

  return (
    <>
      <ListItem dense className={css.field} onClick={handleClick} button>
        <ListItemIcon>
          <Icon name={app.icon} size="md" />
        </ListItemIcon>
        <TextField
          {...inputProps}
          fullWidth
          SelectProps={{ open }}
          size="small"
          label="Launch type"
          value={app.launchType}
          onChange={e => handleChange(e.target.value)}
        >
          <MenuItem value={LAUNCH_TYPE.url}>URL</MenuItem>
          <MenuItem value={LAUNCH_TYPE.command}>Command</MenuItem>
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
