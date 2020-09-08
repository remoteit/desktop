import React from 'react'
import { Button, ListItemSecondaryAction, Tooltip, Chip, makeStyles } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { spacing } from '../../styling'
import { Icon } from '../Icon'
import { ServiceMiniState } from '../ServiceMiniState'

export function ShareDetails({
  scripting,
  shared,
  services,
  service,
  connections,
  setContextMenu
}:
  {
    scripting?: boolean; 
    shared?: number;
    services: IService[]
    service: IService | undefined
    connections: IConnection | undefined
    setContextMenu: React.Dispatch<React.SetStateAction<IContextMenu>>
  }): JSX.Element {
  const css = useStyles()
  const display = service ? services.filter( s => s.id === service.id) : services

  return (
    <ListItemSecondaryAction className={css.indicators}>
      {scripting && (
        <Tooltip title="Allow scripting">
          <Icon name="scroll" size="md" color="grayDark" />
        </Tooltip>
      )}
      {!!shared && (
        display?.map(service => (
          <ServiceMiniState
            key={service.id}
            service={service}
            connection={connections?.find((c: any) => c.id === service.id)}
            setContextMenu={setContextMenu}
          />
        ))
      )}
    </ListItemSecondaryAction>
  )
}

export function ShareSaveActions({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void ; disabled: boolean }): JSX.Element {
  const { saving } = useSelector((state: ApplicationState) => state.shares)
  return (
    <section>
      <Button color="primary" onClick={onSave} disabled={disabled} variant="contained">
        Share
        {saving ? (
          <Icon name="spinner-third" spin type="regular" inline fixedWidth />
        ) : (
          <Icon name="check" type="regular" inline fixedWidth />
        )}
      </Button>
      <Button disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
    </section>
  )
}

const useStyles = makeStyles({
  indicators: {
    display: 'flex',
    alignItems: 'center',
    '& > *': { marginLeft: spacing.lg },
  },
})
