import React from 'react'
import { replaceHost } from '../../shared/nameHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { REGEX_IP_SAFE, IP_PRIVATE, IP_OPEN } from '../../shared/constants'
import { newConnection, setConnection, connectionState } from '../../helpers/connectionHelper'

export const HostSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  const state = connectionState(service, connection)

  const currentHost = (connection && connection.host) || IP_PRIVATE
  const disabled = state === 'connected' || state === 'connecting'

  return (
    <InlineTextFieldSetting
      value={currentHost}
      displayValue={replaceHost(currentHost)}
      label="Bind IP Address"
      disabled={disabled}
      resetValue={IP_PRIVATE}
      filter={REGEX_IP_SAFE}
      onSave={host =>
        connection &&
        setConnection({
          ...connection,
          host: host.toString() || connection.host,
          restriction: IP_OPEN,
        })
      }
    />
  )
}
