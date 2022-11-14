import url from 'url'
import classnames from 'classnames'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { DEFAULT_SERVICE } from '../shared/constants'
import { ApplicationState } from '../store'
import { getApplicationType } from '../shared/applications'
import { Typography, TextField, Divider, Button, Box, Chip } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectUniqueSchemeTypes } from '../models/applicationTypes'
import { ServiceFormProps } from './ServiceForm'
import { PortScanIcon } from './PortScanIcon'
import { usePortScan } from '../hooks/usePortScan'
import { spacing } from '../styling'
import { Gutters } from './Gutters'

export const ServiceSmartForm: React.FC<ServiceFormProps> = ({ service, thisDevice, disabled, onSubmit }) => {
  const { applicationTypes, keyApplications, saving } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    keyApplications: selectUniqueSchemeTypes(state),
    saving: !!(state.ui.setupBusy || (state.ui.setupServiceBusy === service?.id && service?.id)),
  }))

  const [portReachable, portScan] = usePortScan()
  const [field, setField] = useState<string>('http://')
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
    typeID: applicationType?.id || DEFAULT_SERVICE.typeID,
    deviceId: service?.deviceID,
    name: application.title,
    host: parsed.hostname || DEFAULT_SERVICE.host,
    enabled: true,
    attributes: {
      targetHost: applicationType?.proxy && parsed.href ? parsed.href : undefined,
      launchTemplate: application.launchTemplate + (parsed.path ? parsed.path : ''),
    },
  }

  useEffect(() => {
    if (thisDevice) portScan({ port, host: form.host })
  }, [field])

  return (
    <>
      <form
        className={classnames(css.item)}
        onSubmit={event => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <TextField
          required
          value={field}
          label="Target Endpoint"
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
        <Button type="submit" variant="contained" color="primary" size="large" disabled={!isValid || disabled}>
          {saving ? 'Adding...' : 'Add'}
        </Button>
      </form>
      <Gutters inset="sm" className={css.item}>
        {/* <Typography variant="caption" textAlign="center" className={css.fullWidth}>
          Service Types
        </Typography> */}
        <Box className={css.item}>
          {keyApplications.map(
            t =>
              t.scheme && (
                <Chip
                  label={t.name}
                  key={t.id}
                  onClick={() => {
                    parsed.protocol = t.scheme + ':'
                    setField(url.format(parsed))
                  }}
                  color={t.id === applicationType?.id ? 'primary' : undefined}
                  variant="filled"
                  size="small"
                />
              )
          )}
          <Divider orientation="vertical" />
          <Chip
            label="Advanced setup"
            to="./addForm"
            variant="filled"
            component={Link}
            onClick={console.log}
            size="small"
          />
        </Box>
      </Gutters>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '4vh',
    maxWidth: 600,
    width: '80%',
    '& > *': { margin: spacing.xxs },
    '& .MuiBox-root': { maxWidth: 420 },
    '& .MuiTextField-root': { flexGrow: 1 },
    '& .MuiFilledInput-root': { minWidth: 250 },
    '& .MuiButton-root': { marginTop: spacing.xs },
    '& .MuiDivider-root': {
      height: '1em',
      marginTop: spacing.xs,
      marginLeft: spacing.sm,
      marginRight: spacing.sm,
      borderColor: palette.gray.main,
    },
  },
}))
