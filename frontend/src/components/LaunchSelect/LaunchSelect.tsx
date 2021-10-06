import React from 'react'
import { Box, ListItem, ListItemIcon, makeStyles, MenuItem, TextField, Tooltip } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { useApplication } from '../../hooks/useApplication'
import { Icon } from '../Icon'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'


type Props = {
  service: IService
  connection?: IConnection
  actionIcon?: React.ReactElement
  disabled?: boolean
  launchType?: string
}

const ITEM = [{ id: 0, label: 'Use command' }, { id: 1, label: 'Use URL' }]

export const LaunchSelect: React.FC<Props> = ({
  service,
  connection,
  launchType
}) => {
  if (!connection) connection = newConnection(service)
  const { devices } = useDispatch<Dispatch>()


  const appCommand = useApplication('copy', service, connection)
  const appUrl = useApplication('launch', service, connection)
  const css = useStyles();
  const app = launchType === 'Use command' ? appCommand : appUrl


  const onSave = (template) => {
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
          label="LAUNCH TYPE"
          value={launchType}
          variant="filled"
          onChange={e => onChange(e.target.value)}
        >
          {ITEM.map(item => {
            return (
              <MenuItem
                value={item.label}
                key={item.id}
              >
                {item.label}
              </MenuItem>
            )
          })}
        </TextField>
      </ListItem>
      <ListItem dense>
        <ListItemIcon></ListItemIcon>
        <div className={css.verticalLine}>
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

        </div>
      </ListItem>
    </Box>
  )

}

const useStyles = makeStyles({
  field: { width: 200, marginRight: spacing.sm, '& .MuiListItemSecondaryAction-root': { display: 'none' } },
  divider: { marginTop: spacing.xxs, marginBottom: spacing.xxs },
  action: { right: spacing.xs, marginLeft: spacing.sm },
  verticalLine: {
    borderColor: colors.grayLight,
    borderWidth: '0 0 2px 2px',
    borderBottomWidth: 0,
    borderBottomColor: colors.grayLight,
    borderBottomStyle: 'solid',
    borderStyle: 'solid',
    height: '3.6em',
    marginRight: '-1.5em',
  }
})