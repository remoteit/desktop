import React from 'react'
import { ListItemSecondaryAction, Tooltip, makeStyles } from '@material-ui/core'
import { spacing } from '../../styling'
import { Icon } from '../Icon'
import { ServiceMiniState } from '../ServiceMiniState'

export function ShareDetails({
  scripting,
  shared,
  services,
  service,
  connections,
}: {
  scripting?: boolean
  shared?: number
  services: IService[]
  service: IService | undefined
  connections: IConnection | undefined
}): JSX.Element {
  const css = useStyles()
  const display = service ? services.filter(s => s.id === service.id) : services

  return (
    <ListItemSecondaryAction className={css.indicators}>
      {scripting && (
        <Tooltip title="Allow scripting" arrow placement="top">
          <Icon name="scroll" size="sm" color="grayDark" />
        </Tooltip>
      )}
      {!!shared &&
        display?.map(service => (
          <ServiceMiniState
            key={service.id}
            service={service}
            connection={connections?.find((c: any) => c.id === service.id)}
          />
        ))}
    </ListItemSecondaryAction>
  )
}

const useStyles = makeStyles({
  indicators: {
    display: 'flex',
    alignItems: 'center',
    '& > .fal': { marginRight: spacing.sm },
  },
})
