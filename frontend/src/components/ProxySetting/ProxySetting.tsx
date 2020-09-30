import React from 'react'
import { ROUTES } from '../../shared/constants'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { InlineSelectSetting } from '../InlineSelectSetting'
import { Icon } from '../Icon'

export const ProxySetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  const disabled = connection.active || connection.connecting || service.state !== 'active'
  const connectionRoute: IRouteType = connection.proxyOnly ? 'proxy' : connection.failover ? 'failover' : 'p2p'
  const route = ROUTES.find(r => r.key === connectionRoute)

  return (
    <InlineSelectSetting
      label="Routing"
      disabled={disabled || (service.attributes.route && service.attributes.route !== 'failover')}
      icon={<Icon name={route?.icon} size="md" type="light" />}
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
