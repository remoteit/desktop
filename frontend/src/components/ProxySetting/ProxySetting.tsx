import React from 'react'
import { ROUTES } from '../../models/devices'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { InlineSelectSetting } from '../InlineSelectSetting'

export const ProxySetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  const disabled = connection.enabled || connection.public
  const connectionRoute: IRouteType =
    connection.proxyOnly || connection.public ? 'proxy' : connection.failover ? 'failover' : 'p2p'
  const defaultRoute = service?.attributes.route || 'failover'

  const route = ROUTES.find(r => r.key === connectionRoute)

  return (
    <InlineSelectSetting
      label="Routing"
      modified={connectionRoute !== defaultRoute}
      disabled={disabled || (service.attributes.route && service.attributes.route !== 'failover')}
      icon={route?.icon}
      value={connectionRoute}
      values={ROUTES.map(r => ({ key: r.key, name: r.name }))}
      onSave={route => {
        connection &&
          setConnection({
            ...connection,
            failover: route !== 'p2p',
            proxyOnly: route === 'proxy',
          })
      }}
    />
  )
}
