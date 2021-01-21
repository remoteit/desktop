import React from 'react'
import { useSelector } from 'react-redux'
import { Typography, TextField, ListItem, MenuItem } from '@material-ui/core'
import { useApplication } from '../hooks/useApplication'
import { ApplicationState } from '../store'
import { TemplateSetting } from './TemplateSetting'
import { ROUTES } from '../shared/constants'
import { Notice } from './Notice'
import { Quote } from './Quote'

type Props = IService['attributes'] & {
  className?: string
  subClassName?: string
  connection?: IConnection
  disabled: boolean
  attributes: IService['attributes']
  onUpdate: (attributes: IService['attributes']) => void
}

export const ServiceAttributesForm: React.FC<Props> = ({
  className,
  subClassName,
  disabled,
  connection,
  attributes,
  onUpdate,
}) => {
  const { routingLock, routingMessage } = useSelector((state: ApplicationState) => state.ui)
  const copyApp = useApplication('copy', undefined, connection)
  const launchApp = useApplication('launch', undefined, connection)

  // Defaults
  attributes = {
    ...attributes,
    route: routingLock || attributes.route || ROUTES[0].key,
    commandTemplate: attributes.commandTemplate || copyApp.template,
    launchTemplate: attributes.launchTemplate || launchApp.template,
  }

  React.useEffect(() => {
    // ensure defaults are passed
    onUpdate(attributes)
  }, [])

  return (
    <>
      <ListItem className={className}>
        <TextField
          select
          size="small"
          label="Routing"
          value={attributes.route}
          disabled={!!routingLock || disabled}
          variant="filled"
          onChange={event => {
            onUpdate({ ...attributes, route: event.target.value as IRouteType })
          }}
        >
          {ROUTES.map(route => (
            <MenuItem value={route.key} key={route.key}>
              {route.name}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption">
          {routingMessage || ROUTES.find(route => route.key === attributes.route)?.description}
        </Typography>
      </ListItem>
      <TemplateSetting
        className={className}
        label={`${launchApp.contextTitle} Template`}
        value={attributes.launchTemplate}
        disabled={disabled}
        onChange={value => onUpdate({ ...attributes, launchTemplate: value })}
      >
        Replacement tokens <b>{launchApp.tokens.join(', ')}</b>
        <br />
        <b>{launchApp.command}</b>
      </TemplateSetting>
      <TemplateSetting
        className={className}
        label={`${copyApp.contextTitle} Template`}
        value={attributes.commandTemplate}
        disabled={disabled}
        onChange={value => onUpdate({ ...attributes, commandTemplate: value })}
      >
        Replacement tokens <b>{copyApp.tokens.join(', ')}</b>
        <br />
        <b>{copyApp.command}</b>
      </TemplateSetting>
      <ListItem className={subClassName}>
        {launchApp.customTokens.length ? (
          <Quote>
            {launchApp.customTokens.map(token => (
              <TextField
                fullWidth
                size="small"
                key={token}
                label={`${token} default`}
                value={attributes[token] || ''}
                disabled={disabled}
                variant="filled"
                onChange={event => onUpdate({ ...attributes, [token]: event.target.value })}
              />
            ))}
          </Quote>
        ) : (
          <Notice fullWidth>
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
