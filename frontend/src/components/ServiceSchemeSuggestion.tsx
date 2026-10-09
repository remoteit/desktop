import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button } from '@mui/material'
import { Dispatch } from '../store'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { DetectedScheme, graphQLDetectedSchemes } from '../services/graphQLDetectedScheme'
import { Notice } from './Notice'

export const HTTP_TYPE = 7
export const HTTPS_TYPE = 8

/* The type and port a service answers on, where its device found them other than its type says (Service.detectedScheme):
   none when nothing was found, the scheme is not http or https, or the service is already that type on that port. */
export function schemeSuggestion(
  detected: DetectedScheme | null | undefined,
  service: Pick<IService, 'typeID' | 'port'>
): { typeID: number; port: number; serves: 'http' | 'https' } | null {
  if (!detected) return null
  const serves = detected.serves?.toLowerCase()
  if (serves !== 'http' && serves !== 'https') return null
  const typeID = serves === 'https' ? HTTPS_TYPE : HTTP_TYPE
  if (service.typeID === typeID && service.port === detected.port) return null
  return { typeID, port: detected.port, serves }
}

/* Offers to change a service's type to the scheme it answers, for whoever may edit it. Never changes it by itself. */
export const ServiceSchemeSuggestion: React.FC<{ device?: IDevice; service?: IService }> = ({ device, service }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const deviceSessions = useDeviceSessions()
  const [detected, setDetected] = useState<DetectedScheme | null>(null)
  const [busy, setBusy] = useState(false)
  const editable = !!device?.configurable && !!device?.permissions.includes('MANAGE')

  useEffect(() => {
    setDetected(null)
    if (!deviceSessions || !editable || !device || !service) return
    let current = true
    graphQLDetectedSchemes(device.id).then(result => {
      if (current && typeof result === 'object') setDetected(result[service.id] ?? null)
    })
    return () => {
      current = false
    }
  }, [deviceSessions, editable, device?.id, service?.id, service?.typeID, service?.port])

  const suggestion = service && schemeSuggestion(detected, service)
  if (!device || !service || !suggestion) return null

  const apply = async () => {
    setBusy(true)
    const set = { typeID: suggestion.typeID, port: suggestion.port }
    await dispatch.devices.cloudUpdateService({ form: { ...service, ...set }, deviceId: device.id })
    await dispatch.devices.updateService({ id: service.id, set })
    setDetected(null)
    setBusy(false)
  }

  const https = suggestion.serves === 'https'
  return (
    <Notice
      gutterTop
      severity="info"
      loading={busy}
      button={
        <Button size="small" variant="contained" color="primary" disabled={busy} onClick={apply}>
          {https ? t('serviceScheme.switchHttps', 'Switch to HTTPS') : t('serviceScheme.switchHttp', 'Switch to HTTP')}
        </Button>
      }
    >
      {https
        ? t(
            'serviceScheme.answersHttps',
            'This service answers over HTTPS — switch its type to HTTPS (port {{port}})?',
            {
              port: suggestion.port,
            }
          )
        : t('serviceScheme.answersHttp', 'This service answers plain HTTP — switch its type to HTTP (port {{port}})?', {
            port: suggestion.port,
          })}
    </Notice>
  )
}
