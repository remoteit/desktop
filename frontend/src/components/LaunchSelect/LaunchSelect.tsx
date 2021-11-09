import React from 'react'
import { List, ListItem, ListItemIcon, makeStyles, MenuItem, TextField } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { CustomAttributeSettings } from '../CustomAttributeSettings'
import { InlineTemplateSetting } from '../InlineTemplateSetting'
import { AutoLaunchToggle } from '../AutoLaunchToggle'
import { colors, spacing } from '../../styling'
import { useApplication } from '../../hooks/useApplication'
import { TestUI } from '../TestUI'
import { Quote } from '../Quote'
import { Icon } from '../Icon'
import { isPortal } from '../../services/Browser'
import { LAUNCH_TYPE } from '../../shared/applications'

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

  connection.context = app.launchType === LAUNCH_TYPE.COMMAND ? 'copy' : 'launch'

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
    disabled: false,
  }

  if (isPortal()) {
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
          label="Launch type"
          value={isPortal() ? 'URL' : app.launchType}
          onChange={e => handleChange(e.target.value)}
        >
          <MenuItem value={LAUNCH_TYPE.URL}>URL</MenuItem>
          <MenuItem value={LAUNCH_TYPE.COMMAND}>Command</MenuItem>
        </TextField>
      </ListItem>
      <ListItem dense>
        <ListItemIcon></ListItemIcon>
        <Quote margin={0} noInset>
          <List disablePadding className={css.indent}>
            <InlineTemplateSetting
              connection={connection}
              service={service}
              context={app.launchType === 'COMMAND' ? 'copy' : 'launch'}
            />
            <CustomAttributeSettings connection={connection} service={service} />
            <TestUI>
              <AutoLaunchToggle connection={connection} service={service} />
            </TestUI>
          </List>
        </Quote>
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  menu: { textTransform: 'capitalize' },
  indent: { marginRight: -spacing.lg },
  field: {
    '&:hover': { backgroundColor: colors.primaryHighlight },
    /*  marginRight: spacing.sm, '& .MuiListItemSecondaryAction-root': { display: 'none' } */
  },
})
