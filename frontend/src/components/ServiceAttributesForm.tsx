import React from 'react'
import { useTranslation } from 'react-i18next'
import browser from '../services/browser'
import { State } from '../store'
import { fieldSx } from './ServiceForm'
import { useSelector } from 'react-redux'
import { useApplication } from '../hooks/useApplication'
import { Typography, TextField, List, ListItem, MenuItem } from '@mui/material'
import { validPort, isFileToken } from '../helpers/connectionHelper'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { ListItemCheckbox } from './ListItemCheckbox'
import { TemplateSetting } from './TemplateSetting'
import { ROUTES } from './RouteSetting'
import { Notice } from './Notice'
import { Quote } from './Quote'

type Props = IService['attributes'] & {
  connection?: IConnection
  disabled: boolean
  customTokens?: string[]
  customTokensNote?: ILookup<React.ReactNode>
  attributes: IService['attributes']
  globalDefaults?: boolean
  onChange: (attributes: IService['attributes']) => void
}

export const ServiceAttributesForm: React.FC<Props> = ({
  disabled,
  connection,
  customTokens = [],
  customTokensNote = {},
  attributes,
  globalDefaults,
  onChange,
}) => {
  const { t } = useTranslation()
  const { routingLock, routingMessage } = useSelector((state: State) => state.ui)
  const app = useApplication(undefined, connection)

  customTokens = customTokens.length ? customTokens : app.allCustomTokens

  return (
    <>
      {!globalDefaults && (
        <ListItem sx={fieldSx}>
          <TextField
            label={t('serviceAttributesForm.localPort', 'Local Port')}
            value={attributes.defaultPort || ''}
            disabled={disabled}
            variant="filled"
            onChange={event => onChange({ ...attributes, defaultPort: validPort(event) })}
          />
          <Typography variant="caption">
            {t(
              'serviceAttributesForm.localPortCaption',
              'Default local port to use when a system connects to this service.'
            )}{' '}
            <b>{t('serviceAttributesForm.localPortAutoAssign', 'Port will auto assign if unset.')}</b>
          </Typography>
        </ListItem>
      )}
      <ListItem sx={fieldSx}>
        <TextField
          select
          label={t('serviceAttributesForm.routing', 'Routing')}
          value={routingLock || attributes.route || ''}
          disabled={!!routingLock || disabled}
          variant="filled"
          placeholder={routingLock || attributes.route || ROUTES[0].key}
          onChange={event => onChange({ ...attributes, route: event.target.value as IRouteType })}
        >
          <MenuItem value="">
            <i>{t('serviceAttributesForm.noDefaultOverride', 'No default override')}</i>
          </MenuItem>
          {ROUTES.map(route => (
            <MenuItem value={route.key} key={route.key}>
              {route.name}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption">
          {routingMessage || ROUTES.find(route => route.key === attributes.route)?.description}
          <i> {t('serviceAttributesForm.routingDesktopOnly', 'Routing is only available on desktop.')}</i>
          <b> {t('serviceAttributesForm.defaultAdaptiveRouting', 'Default adaptive routing')}</b>
        </Typography>
      </ListItem>
      {!globalDefaults && app.reverseProxy && (
        <ListItem sx={fieldSx}>
          <TextField
            label={t('serviceAttributesForm.hostHeaderOverride', 'Host Header Override')}
            value={attributes.targetHost || ''}
            disabled={disabled}
            variant="filled"
            onChange={event => onChange({ ...attributes, targetHost: event.target.value.toString() })}
          />
          <Typography variant="caption">
            {t(
              'serviceAttributesForm.hostHeaderOverrideCaption',
              'A way to specify a different hostname in the host header of an HTTP request. Can be used in load balancing scenarios to route requests to the appropriate server.'
            )}
            <i>
              &nbsp;{t('serviceAttributesForm.example', 'Example')}
              <b> webui.example.com</b>
            </i>
          </Typography>
        </ListItem>
      )}
      {globalDefaults && (
        <>
          <ListItem sx={fieldSx}>
            <TextField
              select
              variant="filled"
              label={t('serviceAttributesForm.launchMethod', 'Launch method')}
              value={attributes.launchType || ''}
              onChange={event => onChange({ ...attributes, launchType: event.target.value })}
            >
              <MenuItem value="">
                <i>{t('serviceAttributesForm.noDefaultOverride', 'No default override')}</i>
              </MenuItem>
              <MenuItem value="URL">URL</MenuItem>
              <MenuItem value="COMMAND">{t('serviceAttributesForm.command', 'Command')}</MenuItem>
            </TextField>
          </ListItem>
          <ListItem dense>
            <ListItemCheckbox
              disableGutters
              label={t('serviceAttributesForm.autoLaunch', 'Auto Launch')}
              checked={attributes.autoLaunch}
              indeterminate={attributes.autoLaunch === undefined}
              onClick={autoLaunch =>
                onChange({ ...attributes, autoLaunch: attributes.autoLaunch === false ? undefined : autoLaunch })
              }
            />
          </ListItem>
        </>
      )}
      <TemplateSetting
        sx={fieldSx}
        label={`${app.launchTitle} Template`}
        value={attributes.launchTemplate || ''}
        placeholder={app.launchTemplate}
        disabled={disabled}
        onChange={value => onChange({ ...attributes, launchTemplate: value })}
      >
        {t('serviceAttributesForm.defaultTokens', 'Default tokens')} <b>{app.defaultTokens.join(', ')}</b>
        <br />
        {t('serviceAttributesForm.defaultTemplate', 'Default template')}{' '}
        <b>{globalDefaults ? app.defaultLaunchTemplate : app.launchTemplate}</b>
        {!!app.launchCustomTokens.length && (
          <>
            <br />
            {t('serviceAttributesForm.customTokens', 'Custom tokens')} <b>{app.launchCustomTokens.join(', ')}</b>
          </>
        )}
      </TemplateSetting>
      <TemplateSetting
        sx={fieldSx}
        label={`${app.commandTitle} Template`}
        value={attributes.commandTemplate || ''}
        placeholder={app.commandTemplate}
        disabled={disabled}
        onChange={value => onChange({ ...attributes, commandTemplate: value })}
      >
        {t('serviceAttributesForm.defaultTokens', 'Default tokens')} <b>{app.defaultTokens.join(', ')}</b>
        <br />
        {t('serviceAttributesForm.defaultTemplate', 'Default template')}{' '}
        <b>{globalDefaults ? app.defaultCommandTemplate : app.commandTemplate}</b>
        {!!app.commandCustomTokens.length && (
          <>
            <br />
            {t('serviceAttributesForm.customTokens', 'Custom tokens')} <b>{app.commandCustomTokens.join(', ')}</b>
          </>
        )}
      </TemplateSetting>
      <ListItem>
        {customTokens.length ? (
          <Quote margin="xs" indent="listItem" noInset>
            <List disablePadding>
              {customTokens.map(token =>
                isFileToken(token) && browser.hasBackend ? (
                  <InlineFileFieldSetting
                    key="path"
                    token={token}
                    dense={false}
                    variant="filled"
                    label={t('serviceAttributesForm.applicationPath', 'Application Path')}
                    value={attributes[token] || ''}
                    onSave={value => onChange({ ...attributes, [token]: value })}
                  />
                ) : (
                  <ListItem disableGutters key={token} sx={fieldSx}>
                    <TextField
                      fullWidth
                      label={t('serviceAttributesForm.tokenDefault', {
                        token,
                        defaultValue: '{{token}} default',
                      })}
                      value={attributes[token] || ''}
                      disabled={disabled}
                      variant="filled"
                      onChange={event => onChange({ ...attributes, [token]: event.target.value })}
                    />
                    {customTokensNote[token] && (
                      <Typography variant="caption">
                        {t('serviceAttributesForm.tokenFoundIn', 'This token was found in')} {customTokensNote[token]}
                      </Typography>
                    )}
                  </ListItem>
                )
              )}
            </List>
          </Quote>
        ) : (
          <Notice>
            {t('serviceAttributesForm.addCustomTokens', 'Add custom [tokens]')}
            <em>
              {t(
                'serviceAttributesForm.addCustomTokensDescription',
                'You can add custom [tokens] to the templates above. Just enclose a tag in brackets to create a [token] you can set a default value for. If not filled out, tokens will prompt you at time of connection.'
              )}
            </em>
          </Notice>
        )}
      </ListItem>
    </>
  )
}
