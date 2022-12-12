import url from 'url'
import classnames from 'classnames'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { DEFAULT_SERVICE } from '../shared/constants'
import { ApplicationState } from '../store'
import { getApplicationType } from '../shared/applications'
import { serviceNameValidation } from '../shared/nameHelper'
import { Typography, TextField, Divider, Button, Box, Chip } from '@mui/material'
import { selectUniqueSchemeTypes } from '../models/applicationTypes'
import { ListItemLocation } from './ListItemLocation'
import { ServiceFormProps } from './ServiceForm'
import { PortScanIcon } from './PortScanIcon'
import { usePortScan } from '../hooks/usePortScan'
import { spacing } from '../styling'
import { Gutters } from './Gutters'
import { Icon } from './Icon'
import { Pre } from './Pre'

type Props = ServiceFormProps & {
  nameField?: boolean
}

export const ServiceSmartForm: React.FC<Props> = ({
  nameField = true,
  service,
  thisDevice,
  disabled,
  onSubmit,
  onChange,
}) => {
  const { applicationTypes, keyApplications, saving } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    keyApplications: selectUniqueSchemeTypes(state),
    saving: !!(state.ui.setupAddingService || (service && state.ui.setupServiceBusy === service.id)),
  }))

  const [portReachable, portScan] = usePortScan()
  const [field, setField] = useState<string>('http://127.0.0.1')
  const [error, setError] = useState<string>()
  const [name, setName] = useState<string>()
  const css = useStyles()

  disabled = disabled || saving

  const parsed = url.parse(field)
  const scheme = parsed.protocol?.slice(0, -1)
  const applicationType = applicationTypes.find(a => a.scheme === scheme)
  const application = getApplicationType(applicationType?.id)
  const port = parsed.port ? parseInt(parsed.port, 10) : applicationType?.port
  const isValid = !!port && !!parsed.host
  const form = {
    ...DEFAULT_SERVICE,
    port,
    id: service?.id || '',
    typeID: applicationType?.id || DEFAULT_SERVICE.typeID,
    deviceId: service?.deviceID,
    name: name || applicationType?.name || application.title,
    host: parsed.hostname || '',
    enabled: true,
    attributes: {
      targetHost: applicationType?.proxy && parsed.host ? parsed.host : undefined,
      launchTemplate: application.launchTemplate + (parsed.path ? parsed.path : ''),
    },
  }

  useEffect(() => {
    if (thisDevice) portScan({ port, host: form.host })
    if (onChange) onChange(form)
  }, [field])

  return (
    <>
      <form
        className={css.item}
        onSubmit={event => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        {nameField && (
          <TextField
            fullWidth
            label="Name"
            value={name}
            disabled={disabled}
            error={!!error}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            helperText={error || ''}
            placeholder={applicationType?.name || application.title}
            onChange={event => {
              const validation = serviceNameValidation(event.target.value, true)
              setName(validation.value)
              validation.error ? setError(validation.error) : setError(undefined)
            }}
          />
        )}
        <TextField
          required
          value={field}
          label="Endpoint"
          disabled={disabled}
          variant="filled"
          InputLabelProps={{ shrink: !!field }}
          helperText={<Typography variant="caption">Example: {application.example}</Typography>}
          placeholder={application.example}
          onChange={event => setField(event.target.value)}
          InputProps={{
            endAdornment: thisDevice && <PortScanIcon state={portReachable} port={form.port} host={form.host} />,
          }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!isValid || disabled || saving}
        >
          {saving ? 'Adding...' : 'Add'}
        </Button>
      </form>
      <Gutters inset="sm" className={css.item}>
        {keyApplications.map(
          t =>
            t.scheme && (
              <Chip
                label={t.name}
                key={t.id}
                onClick={() => {
                  parsed.protocol = t.scheme + ':'
                  if (parsed.pathname === '/') parsed.pathname = null
                  setField(url.format(parsed))
                }}
                color={t.id === applicationType?.id ? 'primary' : undefined}
                variant="filled"
                size="small"
              />
            )
        )}
        <Divider />
        <ListItemLocation pathname="./addForm" title="Advanced setup" dense disableGutters>
          <Icon name="chevron-right" />
        </ListItemLocation>
      </Gutters>
      {/* <Pre {...{ field }} /> */}
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: '4vh',
    maxWidth: 600,
    width: '80%',
    '& > *': { margin: spacing.xxs },
    '& .MuiBox-root': { maxWidth: 420 },
    '& .MuiTextField-root': { flexGrow: 1 },
    '& .MuiFilledInput-root': { minWidth: 250 },
    '& .MuiButton-root': { marginTop: spacing.xs },
    '& .MuiListItem-root': { paddingLeft: spacing.md, paddingRight: spacing.md },
    '& .MuiDivider-root': {
      width: '100%',
      marginTop: spacing.md,
    },
  },
}))
