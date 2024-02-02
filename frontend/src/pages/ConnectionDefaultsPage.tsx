import React, { useState, useEffect } from 'react'
import isEqual from 'lodash.isequal'
import { getAllDevices } from '../selectors/devices'
import { newConnection } from '../helpers/connectionHelper'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { List, MenuItem, TextField, Typography, Button } from '@mui/material'
import { ServiceAttributesForm } from '../components/ServiceAttributesForm'
import { getApplication } from '@common/applications'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Link } from '../components/Link'

export const ConnectionDefaultsPage: React.FC = () => {
  let customConnectionSetting: ILookup<Set<string>> = {}
  let customConnectionNote: ILookup<ILookup<React.ReactNode>> = {}

  function addCustomSettings(tokens: string[], id: number, el: React.ReactNode) {
    customConnectionSetting[id] = customConnectionSetting[id] || new Set()
    customConnectionNote[id] = customConnectionNote[id] || {}
    tokens.forEach(item => {
      customConnectionSetting[id].add(item)
      customConnectionNote[id][item] = el
    })
  }

  const dispatch = useDispatch<Dispatch>()
  const { connectionDefaults, applicationTypes, connections, devices } = useSelector((state: State) => ({
    connectionDefaults: state.user.attributes?.connectionDefaults,
    applicationTypes: state.applicationTypes.all,
    connections: state.connections.all,
    devices: getAllDevices(state),
  }))
  const history = useHistory()
  const { applicationID } = useParams<{ applicationID: string | undefined }>()
  const [form, setForm] = useState<ILookup<any>>({})
  const [saving, setSaving] = useState<boolean>(false)

  const id = Number(applicationID)
  const data = connectionDefaults?.[id] || {}
  const changed = !isEqual(form, data)
  const app = getApplication(undefined, { ...form, enabled: false, id: '', typeID: id })
  addCustomSettings(app.allCustomTokens, id, <>the application type defaults</>)

  applicationTypes.forEach(t => {
    const a = getApplication(undefined, { ...DEFAULT_CONNECTION, typeID: t.id })
    const el = <>application type {t.name}</>
    addCustomSettings(a.allCustomTokens, t.id, el)
  })
  connections.forEach(c => {
    const a = getApplication(undefined, c)
    const el = (
      <>
        connection <Link to={`/connections/${c.id}`}>{c.name}</Link>
      </>
    )
    addCustomSettings(a.allCustomTokens, c.typeID || 0, el)
  })
  devices.forEach(device =>
    device.services.forEach(service => {
      const a = getApplication(service)
      const el = (
        <>
          service
          <Link to={`/devices/${device.id}/${service.id}`}>
            <strong> {service.name}</strong> - {device.name}
          </Link>
        </>
      )
      addCustomSettings(a.allCustomTokens, service.typeID || 0, el)
    })
  )

  const connection = newConnection({ ...DEFAULT_SERVICE, ...form, typeID: id })

  useEffect(() => {
    if (!applicationID) history.push(`/settings/defaults/${applicationTypes[0]?.id}`)
  }, [applicationTypes])

  useEffect(() => {
    setForm(data)
  }, [id])

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
              onChange={e => history.push(`/settings/defaults/${e.target.value}`)}
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
            customTokens={[...customConnectionSetting[id]]}
            customTokensNote={customConnectionNote[id]}
            onChange={attributes => setForm({ ...form, ...attributes })}
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
