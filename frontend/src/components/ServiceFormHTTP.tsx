import React, { useState, useEffect } from 'react'
import { IP_PRIVATE } from '../shared/constants'
import { containsIpAddress } from '../helpers/utilHelper'
import { getApplicationType } from '../shared/applications'
import { Typography, TextField } from '@mui/material'
import { PortScanIcon } from './PortScanIcon'

type Props = {
  form: IService
  disabled?: boolean
  thisDevice?: boolean
  portReachable?: IPortScan
  applicationTypes?: IApplicationType[]
  onInvalid?: (disable: boolean) => void
  onChange: (form: IService) => void
}

const DEFAULT_URL = new URL(`http://${IP_PRIVATE}`)

export const ServiceFormHTTP: React.FC<Props> = ({
  form,
  thisDevice,
  portReachable,
  applicationTypes,
  disabled,
  onInvalid,
  onChange,
}) => {
  const [field, setField] = useState<string>(formToURL(form).origin)
  const [error, setError] = useState<string>()

  const parsed = safeParse(field)
  const scheme = parsed.protocol?.slice(0, -1)
  const applicationType = applicationTypes?.find(a => a.scheme === scheme)
  const application = getApplicationType(applicationType?.id)
  const port = parsed.port ? parseInt(parsed.port, 10) : applicationType?.port

  function formToURL(form: IService) {
    const string = `${form.type.toLowerCase()}://${form.host}:${form.port}`
    return safeParse(string)
  }

  function safeParse(field: string) {
    let result = DEFAULT_URL
    try {
      result = new URL(field)
      if (error) setError(undefined)
    } catch (e) {
      result = DEFAULT_URL
      if (error !== e.message) setError?.(e.message)
    }
    return result
  }

  useEffect(() => {
    onChange({
      ...form,
      port,
      typeID: applicationType?.id || form.typeID,
      host: parsed.hostname || form.host,
      attributes: {
        ...form.attributes,
        targetHost: applicationType?.proxy && !containsIpAddress(parsed) ? parsed.host : undefined,
        launchTemplate: parsed.pathname.length > 1 ? application.launchTemplate + parsed.pathname : undefined,
      },
    })
  }, [field])

  useEffect(() => {
    console.log('form change', applicationType?.id, '!==', form.typeID)
    if (applicationType?.id !== form.typeID) setField(formToURL(form).origin)
  }, [form])

  useEffect(() => {
    onInvalid?.(!!error)
  }, [error])

  return (
    <>
      <TextField
        required
        value={field}
        label="Endpoint"
        variant="filled"
        error={!!error}
        disabled={disabled}
        helperText={error}
        InputLabelProps={{ shrink: !!field }}
        placeholder={application.example}
        onChange={event => setField('http' + event.target.value.slice(4))}
        InputProps={{
          endAdornment: thisDevice && <PortScanIcon state={portReachable} port={form.port} host={form.host} />,
        }}
      />
      <Typography variant="caption">
        URL of the service you want to connect to. Example: {application.example}
      </Typography>
    </>
  )
}
