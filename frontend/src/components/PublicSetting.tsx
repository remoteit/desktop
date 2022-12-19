import React from 'react'
import { setConnection } from '../helpers/connectionHelper'
import { IP_OPEN, IP_LATCH } from '../shared/constants'
import { SelectSetting } from './SelectSetting'

export const PublicSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!connection || !connection.public || connection.connectLink) return null

  const disabled = connection.enabled || service.attributes.route === 'p2p'
  const helpMessage =
    connection.publicRestriction === IP_LATCH
      ? 'The connection will latch onto the first device to connect with IP restriction.'
      : 'Any device will be able to connect while the connection is active.'

  return (
    <SelectSetting
      icon={connection.publicRestriction === IP_LATCH ? 'lock' : 'unlock'}
      label="Security"
      helpMessage={helpMessage}
      disabled={disabled || !connection.public}
      modified={connection.publicRestriction !== IP_LATCH}
      value={connection.publicRestriction || IP_LATCH}
      values={[
        { name: 'IP Latching', key: IP_LATCH },
        { name: 'None', key: IP_OPEN },
      ]}
      onChange={key => {
        connection &&
          setConnection({
            ...connection,
            publicRestriction: key.toString(),
          })
      }}
    />
  )
}
