import React from 'react'
import { Collapse, ListItemText } from '@material-ui/core'
import { setConnection, newConnection } from '../helpers/connectionHelper'
import { IP_OPEN, IP_LATCH } from '../shared/constants'
import { InlineSelectSetting } from './InlineSelectSetting'
import { ListItemSetting } from './ListItemSetting'
import { DesktopUI } from './DesktopUI'
import { Gutters } from './Gutters'

export const PublicSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!connection) return null

  const defaults = newConnection(service)
  const disabled = connection.enabled || service.attributes.route === 'p2p'
  const subLabel =
    connection.publicRestriction === IP_LATCH
      ? 'The connection will latch onto the first device to connect with IP restriction.'
      : 'Any device will be able to connect while the connection is active.'

  return (
    <>
      <DesktopUI>
        <ListItemSetting
          label="Proxy connection"
          subLabel="Publicly sharable proxy connection"
          modified={!!connection.public !== !!defaults.public}
          disabled={disabled}
          icon="share-alt"
          toggle={!!connection.public}
          onClick={() =>
            connection &&
            setConnection({
              ...connection,
              public: !connection.public,
            })
          }
        />
      </DesktopUI>
      <Collapse in={connection.public} timeout={400}>
        <InlineSelectSetting
          icon="lock"
          label="Security"
          disabled={disabled || !connection.public}
          value={connection.publicRestriction || IP_LATCH}
          values={[
            { name: 'IP Latching', key: IP_LATCH },
            { name: 'None', key: IP_OPEN },
          ]}
          onSave={key => {
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
      </Collapse>
    </>
  )
}
