import React from 'react'
import { useSelector } from 'react-redux'
import { Typography, TextField, ListItem, MenuItem } from '@material-ui/core'
import { useApplicationService } from '../shared/applications'
import { ApplicationState } from '../store'
import { TemplateSetting } from './TemplateSetting'
import { ROUTES } from '../shared/constants'
import { Quote } from './Quote'

type Props = IService['attributes'] & {
  className?: string
  subClassName?: string
  service?: IService
  disabled: boolean
  attributes: IService['attributes']
  setAttributes: (attributes: IService['attributes']) => void
}

export const ServiceAttributesForm: React.FC<Props> = ({
  className,
  subClassName,
  disabled,
  service,
  attributes,
  setAttributes,
}) => {
  const { routingLock, routingMessage } = useSelector((state: ApplicationState) => state.ui)
  const copyApp = useApplicationService('copy', service)
  const launchApp = useApplicationService('launch', service)
  // const appType = findType(applicationTypes, attributes.type)

  return (
    <>
      <ListItem className={className}>
        <TextField
          select
          label="Routing"
          value={attributes.route}
          disabled={!!routingLock || disabled}
          variant="filled"
          onChange={event => {
            setAttributes({ ...attributes, route: event.target.value as IRouteType })
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
        onChange={value => setAttributes({ ...attributes, launchTemplate: value })}
      >
        Replacement tokens {launchApp.tokens}
        <br />
        <b>{launchApp.command}</b>
      </TemplateSetting>
      <TemplateSetting
        className={className}
        label={`${copyApp.contextTitle} Template`}
        value={attributes.commandTemplate}
        disabled={disabled}
        onChange={value => setAttributes({ ...attributes, commandTemplate: value })}
      >
        Replacement tokens {copyApp.tokens}
        <br />
        <b>{copyApp.command}</b>
      </TemplateSetting>
      <ListItem className={subClassName}>
        <Quote>
          {launchApp.tokens.map(token => (
            <TextField
              fullWidth
              key={token}
              label={token}
              value={attributes[token]}
              disabled={disabled}
              variant="filled"
              onChange={event => setAttributes({ ...attributes, [token]: event.target.value })}
            />
          ))}
        </Quote>
      </ListItem>
    </>
  )
}
