import React, { useState, useEffect } from 'react'
import { isEqual } from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getAllDevices } from '../models/accounts'
import { newConnection } from '../helpers/connectionHelper'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '../shared/constants'
import { List, MenuItem, TextField, Typography, Button } from '@material-ui/core'
import { ServiceAttributesForm } from '../components/ServiceAttributesForm'
import { getApplication } from '../shared/applications'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionDefaultsPage: React.FC = () => {
  let customAttributes: ILookup<Set<string>> = {}

  function addCustomAttributes(tokens: string[], id: number) {
    customAttributes[id] = customAttributes[id] || new Set()
    tokens.forEach(item => customAttributes[id].add(item))
  }

  const dispatch = useDispatch<Dispatch>()
  const { connectionDefaults, applicationTypes, connections, devices } = useSelector((state: ApplicationState) => ({
    connectionDefaults: state.user.attributes?.connectionDefaults,
    applicationTypes: state.applicationTypes.all,
    connections: state.connections.all,
    devices: getAllDevices(state),
  }))

  const [id, setId] = useState<number>(Number(applicationTypes[0]?.id))
  const [form, setForm] = useState<ILookup<any>>({})
  const [saving, setSaving] = useState<boolean>(false)

  const data = connectionDefaults?.[id] || {}
  const changed = !isEqual(form, data)
  const app = getApplication(undefined, { ...form, enabled: false, id: '', typeID: id })
  addCustomAttributes(app.allCustomTokens, id)

  applicationTypes.forEach(t => {
    const a = getApplication(undefined, { ...DEFAULT_CONNECTION, typeID: t.id })
    addCustomAttributes(a.allCustomTokens, t.id)
  })
  connections.forEach(c => {
    const a = getApplication(undefined, c)
    addCustomAttributes(a.allCustomTokens, c.typeID || 0)
  })
  devices.forEach(device =>
    device.services.forEach(service => {
      const a = getApplication(service)
      addCustomAttributes(a.allCustomTokens, service.typeID || 0)
    })
  )

  const connection = newConnection({ ...DEFAULT_SERVICE, ...form, typeID: id })

  useEffect(() => {
    setId(Number(applicationTypes[0]?.id))
  }, [applicationTypes])

  useEffect(() => {
    setForm(data)
  }, [id])
  console.log('ALL DEFAULTS', connectionDefaults)
  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Connection Defaults</Title>
          </Typography>
          <Gutters bottom="lg" top={null}>
            <Typography variant="caption">Defaults can be overridden by service specific default settings.</Typography>
          </Gutters>
          <Gutters>
            <TextField
              select
              fullWidth
              label="Service Type"
              value={id || ''}
              variant="filled"
              onChange={e => setId(Number(e.target.value))}
            >
              {applicationTypes.map(a => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>
          </Gutters>
        </>
      }
    >
      <Typography variant="subtitle1">{applicationTypes.find(t => t.id === id)?.description}</Typography>
      <Gutters size="sm">
        <List disablePadding>
          <ServiceAttributesForm
            globalDefaults
            connection={connection}
            disabled={false}
            attributes={form}
            customTokens={[...customAttributes[id]]}
            onUpdate={attributes => setForm({ ...form, ...attributes })}
          />
        </List>
      </Gutters>
      <Gutters>
        <Button
          variant="contained"
          color="primary"
          disabled={!changed || saving}
          onClick={async () => {
            setSaving(true)
            const idForm = Object.keys(form).length === 0 ? null : form
            await dispatch.user.setAttribute({ connectionDefaults: { ...connectionDefaults, [id]: idForm } })
            setSaving(false)
          }}
        >
          {saving ? 'Saving...' : changed ? 'Save' : 'Saved'}
        </Button>
        <Button disabled={saving} onClick={() => setForm({})}>
          Reset
        </Button>
      </Gutters>
    </Container>
  )
}
