import React, { useState, useEffect } from 'react'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
import { ROUTES } from '../../shared/constants'
import { useSelector } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import findApplication from '../../shared/applications'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ApplicationState } from '../../store'
import { ServiceAttributesForm } from '../ServiceAttributesForm'
import { serviceNameValidation } from '../../shared/nameHelper'
import { findType } from '../../models/applicationTypes'
import { Columns } from '../Columns'
import { spacing, colors } from '../../styling'

type IServiceForm = ITarget & {
  name: string
  attributes: IService['attributes']
}

type Props = {
  service?: IService
  target?: ITarget
  thisDevice: boolean
  onSubmit: (IServiceForm) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<Props> = ({ service, target = DEFAULT_TARGET, thisDevice, onSubmit, onCancel }) => {
  const { applicationTypes, setupBusy, setupAdded, deleting } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    setupBusy: state.ui.setupBusy,
    setupAdded: state.ui.setupAdded,
    deleting: state.ui.setupServiceBusy === target?.uid,
  }))
  const disabled = setupBusy || deleting
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<ITarget & IServiceForm>(() => {
    // const defaults = findApplication(target.type)
    const defaultAppType = findType(applicationTypes, target.type)
    return {
      name: service?.name || serviceNameValidation(defaultAppType.description).value,
      attributes: service?.attributes || {},
      ...(target || setupAdded),
    }
  })
  const appType = findType(applicationTypes, form.type)
  const css = useStyles()

  return (
    <form onSubmit={() => onSubmit({ ...form, port: form.port || 1 })}>
      <List>
        {thisDevice && (
          <>
            <ListItem className={css.field}>
              <TextField
                select
                autoFocus
                label="Service Type"
                value={form.type}
                disabled={disabled}
                variant="filled"
                onChange={event => {
                  const type = Number(event.target.value)
                  const updatedApp = findApplication(type)
                  const updatedAppType = findType(applicationTypes, type)
                  setForm({
                    ...form,
                    type,
                    port: findType(applicationTypes, type).port || 0,
                    // name: serviceNameValidation(updatedAppType.description).value,
                    // commandTemplate: updatedApp.commandTemplate,
                    // launchTemplate: updatedApp.launchTemplate,
                  })
                }}
              >
                {applicationTypes.map(type => (
                  <MenuItem value={type.id} key={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption">
                {appType.description}
                <br />
                <em>
                  {appType.protocol} protocol {appType.proxy && ' - reverse proxy'}
                </em>
              </Typography>
            </ListItem>
            <ListItem className={css.field}>
              <TextField
                size="small"
                label="Service Port"
                value={form.port}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, port: +event.target.value })}
              />
            </ListItem>
            <ListItem className={css.fieldWide}>
              <TextField
                label="Service Host Address"
                value={form.hostname}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, hostname: event.target.value })}
              />
              <Typography variant="caption">
                Local network IP address or fully qualified domain name to host this service. Leave blank for this
                system to host.
                <br />
                <i>AWS example:</i>
                <b> vpc-domain-name-identifier.region.es.amazonaws.com</b>
              </Typography>
            </ListItem>
          </>
        )}
      </List>
      <Divider />
      <List>
        <ListItem className={css.fieldWide}>
          <TextField
            label="Service Name"
            value={form.name}
            disabled={disabled}
            error={!!error}
            variant="filled"
            helperText={error || ''}
            placeholder={appType.description}
            onChange={event => {
              const validation = serviceNameValidation(event.target.value)
              setForm({ ...form, name: validation.value })
              validation.error ? setError(validation.error) : setError(undefined)
            }}
          />
        </ListItem>
        <ServiceAttributesForm
          className={css.fieldWide}
          subClassName={css.fieldSub}
          service={service}
          disabled={disabled}
          attributes={form.attributes}
          setAttributes={attributes => setForm({ ...form, attributes })}
        />
      </List>
      {thisDevice && (
        <>
          <Divider />
          <List>
            <ListItemCheckbox
              checked={!form.disabled}
              label={form.disabled ? 'Service disabled' : 'Service enabled'}
              subLabel="Disabling your service will take it offline."
              disabled={setupBusy}
              onClick={() => {
                setForm({ ...form, disabled: !form.disabled })
              }}
            />
          </List>
        </>
      )}
      <Columns inset count={1}>
        <span>
          <Button type="submit" variant="contained" color="primary" disabled={setupBusy || !!error}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </span>
      </Columns>
    </form>
  )
}

const useStyles = makeStyles({
  field: {
    paddingLeft: 75,
    paddingRight: spacing.xl,
    '& .MuiFormControl-root': { minWidth: 200, marginRight: 100 + spacing.lg },
  },
  fieldWide: {
    paddingLeft: 75,
    paddingRight: spacing.xl,
    '& .MuiFormControl-root': { minWidth: 300, marginRight: spacing.lg },
  },
  fieldSub: {
    padding: `0 ${spacing.xl}px 0 75px`,
    '& .MuiFormControl-root': {
      minWidth: 300 - spacing.lg,
      display: 'block',
    },
    '& .MuiFormControl-root + .MuiFormControl-root': {
      marginTop: spacing.sm,
    },
  },
})
