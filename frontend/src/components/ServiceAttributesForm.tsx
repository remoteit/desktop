import React from 'react'
import { useStyles } from './ServiceForm'
import { useSelector } from 'react-redux'
import { Typography, TextField, List, ListItem, MenuItem } from '@mui/material'
import { useApplication } from '../hooks/useApplication'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { ApplicationState } from '../store'
import { ListItemCheckbox } from './ListItemCheckbox'
import { TemplateSetting } from './TemplateSetting'
import { validPort } from '../helpers/connectionHelper'
import { isPortal } from '../services/Browser'
import { ROUTES } from '../models/devices'
import { Notice } from './Notice'
import { Quote } from './Quote'

type Props = IService['attributes'] & {
  connection?: IConnection
  disabled: boolean
  customTokens?: string[]
  customTokensNote?: ILookup<React.ReactNode>
  attributes: IService['attributes']
  globalDefaults?: boolean
  onUpdate: (attributes: IService['attributes']) => void
}

export const ServiceAttributesForm: React.FC<Props> = ({
  disabled,
  connection,
  customTokens = [],
  customTokensNote = {},
  attributes,
  globalDefaults,
  onUpdate,
}) => {
  const { routingLock, routingMessage } = useSelector((state: ApplicationState) => state.ui)
  const app = useApplication(undefined, connection)
  const css = useStyles()

  customTokens = customTokens.length ? customTokens : app.allCustomTokens

  return (
    <>
      {!globalDefaults && (
        <ListItem className={css.field}>
          <TextField
            label="Default Local Port"
            value={attributes.defaultPort || ''}
            disabled={disabled}
            variant="filled"
            onChange={event => onUpdate({ ...attributes, defaultPort: validPort(event) })}
          />
          <Typography variant="caption">
            Default local port to use when a system connects to this service. <b>Port will auto assign if unset.</b>
          </Typography>
        </ListItem>
      )}
      <ListItem className={css.field}>
        <TextField
          select
          label="Routing"
          value={routingLock || attributes.route || ''}
          disabled={!!routingLock || disabled}
          variant="filled"
          placeholder={routingLock || attributes.route || ROUTES[0].key}
          onChange={event => onUpdate({ ...attributes, route: event.target.value as IRouteType })}
        >
          <MenuItem value="">
            <i>No default override</i>
          </MenuItem>
          {ROUTES.map(route => (
            <MenuItem value={route.key} key={route.key}>
              {route.name}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption">
          {routingMessage || ROUTES.find(route => route.key === attributes.route)?.description}
          <i> Routing is only available on desktop.</i>
          <b> Default peer to peer with proxy failover</b>
        </Typography>
      </ListItem>
      {globalDefaults && (
        <>
          <ListItem className={css.field}>
            <TextField
              select
              variant="filled"
              label="Launch method"
              value={attributes.launchType || ''}
              onChange={event => onUpdate({ ...attributes, launchType: event.target.value })}
            >
              <MenuItem value="">
                <i>No default override</i>
              </MenuItem>
              <MenuItem value="URL">URL</MenuItem>
              <MenuItem value="COMMAND">Command</MenuItem>
            </TextField>
          </ListItem>
          <ListItem dense>
            <ListItemCheckbox
              disableGutters
              label="Auto Launch"
              checked={attributes.autoLaunch}
              indeterminate={attributes.autoLaunch === undefined}
              onClick={autoLaunch =>
                onUpdate({ ...attributes, autoLaunch: attributes.autoLaunch === false ? undefined : autoLaunch })
              }
            />
          </ListItem>
        </>
      )}
      <TemplateSetting
        className={css.field}
        label={`${app.launchTitle} Template`}
        value={attributes.launchTemplate || ''}
        placeholder={app.launchTemplate}
        disabled={disabled}
        onChange={value => onUpdate({ ...attributes, launchTemplate: value })}
      >
        Default tokens <b>{app.defaultTokens.join(', ')}</b>
        <br />
        Default template <b>{app.defaultLaunchTemplate}</b>
        {!!app.launchCustomTokens.length && (
          <>
            <br />
            Custom tokens <b>{app.launchCustomTokens.join(', ')}</b>
          </>
        )}
      </TemplateSetting>
      <TemplateSetting
        className={css.field}
        label={`${app.commandTitle} Template`}
        value={attributes.commandTemplate || ''}
        placeholder={app.commandTemplate}
        disabled={disabled}
        onChange={value => onUpdate({ ...attributes, commandTemplate: value })}
      >
        Default tokens <b>{app.defaultTokens.join(', ')}</b>
        <br />
        Default template <b>{app.defaultCommandTemplate}</b>
        {!!app.commandCustomTokens.length && (
          <>
            <br />
            Custom tokens <b>{app.commandCustomTokens.join(', ')}</b>
          </>
        )}
      </TemplateSetting>
      <ListItem className={css.fieldSub}>
        {customTokens.length ? (
          <Quote margin="xs">
            <List disablePadding>
              {customTokens.map(token =>
                token === 'path' && !isPortal() ? (
                  <InlineFileFieldSetting
                    key="path"
                    variant="filled"
                    disableGutters
                    dense={false}
                    label="Application Path"
                    value={attributes[token] || ''}
                    onSave={value => onUpdate({ ...attributes, [token]: value })}
                  />
                ) : (
                  <ListItem disableGutters key={token}>
                    <TextField
                      fullWidth
                      label={`${token} default`}
                      value={attributes[token] || ''}
                      disabled={disabled}
                      variant="filled"
                      onChange={event => onUpdate({ ...attributes, [token]: event.target.value })}
                    />
                    {customTokensNote[token] && (
                      <Typography variant="caption">Found in {customTokensNote[token]}</Typography>
                    )}
                  </ListItem>
                )
              )}
            </List>
          </Quote>
        ) : (
          <Notice fullWidth gutterTop>
            Add custom [tokens]
            <em>
              You can add custom [tokens] to the templates above. Just enclose a tag in brackets to create a [token] you
              can set a default value for. If not filled out, tokens will prompt you at time of connection.
            </em>
          </Notice>
        )}
      </ListItem>
    </>
  )
}
