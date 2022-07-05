import React from 'react'
import { ListItemText } from '@mui/material'
import { setConnection } from '../helpers/connectionHelper'
import { IP_OPEN, IP_LATCH } from '../shared/constants'
import { SelectSetting } from './SelectSetting'
import { Gutters } from './Gutters'

export const PublicSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!connection || !connection.public) return null

  const disabled = connection.enabled || service.attributes.route === 'p2p'
  const subLabel =
    connection.publicRestriction === IP_LATCH
      ? 'The connection will latch onto the first device to connect with IP restriction.'
      : 'Any device will be able to connect while the connection is active.'

  return (
    <>
      <SelectSetting
        icon="lock"
        label="Security"
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
      <Gutters inset="icon" top={null}>
        <ListItemText secondary={subLabel} />
      </Gutters>
    </>
  )
}
