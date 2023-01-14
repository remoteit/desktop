import React, { useState, useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import { IP_PRIVATE, DEFAULT_SERVICE, DEFAULT_CONNECTION } from '../shared/constants'
import { List, Button } from '@mui/material'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { serviceNameValidation } from '../shared/nameHelper'
import { ServiceAttributesForm } from './ServiceAttributesForm'
import { findType } from '../models/applicationTypes'
import { Gutters } from './Gutters'

export type ServiceFormProps = {
  service?: IService
  editable: boolean
  disabled?: boolean
  onSubmit: (form: IService) => void
  onCancel?: () => void
}

export const ConnectionDefaultsForm: React.FC<ServiceFormProps> = ({ service, disabled, onSubmit, onCancel }) => {
  const { applicationTypes, saving, setupAdded } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    saving: !!(state.ui.setupBusy || (state.ui.setupServiceBusy === service?.id && service?.id)),
    setupAdded: state.ui.setupAdded,
  }))

  const initForm = () => {
    setError(undefined)
    const defaultType = findType(applicationTypes, service?.typeID || setupAdded?.typeID)
    return {
      ...DEFAULT_SERVICE,
      host: service?.host || IP_PRIVATE,
      id: service?.id || '',
      port: service?.port || defaultType.port,
      type: defaultType.name,
      typeID: defaultType.id,
      enabled: !service || service.enabled,
      name: service?.name || serviceNameValidation(defaultType.name).value,
      attributes: service?.attributes || {},
      ...setupAdded,
    }
  }
  const [defaultForm, setDefaultForm] = useState<IService>()
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<IService>()
  const changed = !isEqual(form, defaultForm)

  disabled = disabled || saving

  useEffect(() => {
    const newForm = initForm()
    setForm(newForm)
    setDefaultForm(cloneDeep(newForm))
  }, [service])

  if (!form) return null

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        onSubmit({ ...form, port: form.port || 1 })
      }}
    >
      <List>
        <ServiceAttributesForm
          connection={{
            ...DEFAULT_CONNECTION,
            ...form.attributes,
            typeID: form.typeID,
          }}
          disabled={disabled}
          attributes={form.attributes}
          onChange={attributes => setForm({ ...form, attributes })}
        />
      </List>
      <Gutters>
        <Button type="submit" variant="contained" color="primary" disabled={disabled || !!error || !changed}>
          {saving ? 'Saving...' : changed ? 'Save' : 'Saved'}
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </Gutters>
    </form>
  )
}
