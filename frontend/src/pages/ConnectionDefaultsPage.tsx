import React, { useState, useEffect } from 'react'
import { isEqual, cloneDeep } from 'lodash'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getAllDevices } from '../models/accounts'
import { DEFAULT_CONNECTION } from '../shared/constants'
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

  const { applicationTypes } = useSelector((state: ApplicationState) => {
    const applicationTypes = state.applicationTypes.all

    applicationTypes.forEach(t => {
      const a = getApplication(undefined, { ...DEFAULT_CONNECTION, typeID: t.id })
      addCustomAttributes(a.allCustomTokens, t.id)
    })
    getAllDevices(state).forEach(device =>
      device.services.forEach(service => {
        const a = getApplication(service)
        addCustomAttributes(a.allCustomTokens, service.typeID || 0)
      })
    )
    state.connections.all.forEach(connection => {
      const a = getApplication(undefined, connection)
      addCustomAttributes(a.allCustomTokens, connection.typeID || 0)
    })

    return { applicationTypes }
  })

  const [id, setId] = useState<number>(Number(applicationTypes[0]?.id))
  const [form, setForm] = useState<IService['attributes']>({ ...DEFAULT_CONNECTION })
  const [saving, setSaving] = useState<boolean>(false)

  const changed = !isEqual(form, {})
  const app = getApplication(undefined, { ...DEFAULT_CONNECTION, ...form, typeID: id })
  addCustomAttributes(app.allCustomTokens, id)

  useEffect(() => {
    setId(Number(applicationTypes[0]?.id))
  }, [applicationTypes])

  useEffect(() => {
    setForm({}) // todo load defaults
  }, [id])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Connection Defaults</Title>
          </Typography>
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
      <Typography variant="subtitle1">{applicationTypes.find(t => t.id === id)?.description} Defaults</Typography>
      <Gutters size="sm">
        <List disablePadding>
          <ServiceAttributesForm
            connection={{
              ...DEFAULT_CONNECTION,
              ...form,
              typeID: id,
              port: form.defaultPort,
            }}
            disabled={false}
            attributes={form}
            customTokens={[...customAttributes[id]]}
            onUpdate={attributes => setForm(attributes)}
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
            // await dispatch.organization.setRole(form)
            setSaving(false)
            setForm(cloneDeep(form)) // reset change detection
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Gutters>
    </Container>
  )
}
