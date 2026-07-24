import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { IP_OPEN } from '@common/constants'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { newConnection, setConnection, getRoute, routeTypeToSettings } from '../helpers/connectionHelper'
import { SelectSetting } from './SelectSetting'

export const ROUTES: IRoute[] = [
  {
    key: 'failover',
    icon: 'code-branch',
    name: i18n.t('routeSetting.adaptiveName', 'Adaptive'),
    description: i18n.t(
      'routeSetting.adaptiveDescription',
      'Will pick the best route available, prioritizing a direct connection to this service.'
    ),
  },
  {
    key: 'p2p',
    icon: 'arrows-h',
    name: i18n.t('routeSetting.p2pName', 'Peer to peer only'),
    description: i18n.t('routeSetting.p2pDescription', 'A direct connection to this service.'),
  },
  {
    key: 'proxy',
    icon: 'cloud',
    name: i18n.t('routeSetting.proxyName', 'Proxy only'),
    description: i18n.t('routeSetting.proxyDescription', 'A private proxy connection routed through the cloud.'),
  },
  {
    key: 'public',
    icon: 'globe',
    name: i18n.t('routeSetting.publicName', 'Public Proxy'),
    description: i18n.t(
      'routeSetting.publicDescription',
      'A cloud proxy connection with a temporary public URL.'
    ),
  },
]

export const RouteSetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()

  if (!service) return null

  const defaults = newConnection(service)
  const disabled =
    connection.connected || ['p2p', 'proxy'].includes(service.attributes.route || '') || connection.connectLink
  const connectionRoute = getRoute(connection)
  const defaultRoute = getRoute(defaults)
  const route = ROUTES.find(r => r.key === connectionRoute)

  return (
    <SelectSetting
      icon={route?.icon}
      disabled={disabled}
      modified={connectionRoute !== defaultRoute}
      defaultValue={defaultRoute}
      label={t('routeSetting.label', 'Routing')}
      value={connectionRoute}
      values={ROUTES.map(r => ({ key: r.key, name: r.name, description: r.description }))}
      onChange={route => {
        setOpen(!open)
        const updated = {
          ...connection,
          ...routeTypeToSettings(route as IRouteType),
          publicRestriction: route === 'public' ? IP_OPEN : undefined,
          enabled: route === 'public' ? false : !!connection.enabled,
          port: connectionRoute === 'public' ? undefined : connection.port,
        }

        if (updated.public && connection.enabled) {
          dispatch.connections.disconnect({ connection })
        }
        setConnection(updated)
      }}
    />
  )
}
