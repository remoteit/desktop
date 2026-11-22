import { useTranslation } from 'react-i18next'
import { useDeviceSessions } from './useDeviceSessions'

export const PUBLIC_ADDRESSES_ROUTE = '/public-addresses'
export const PUBLIC_ADDRESSES_ICON = 'globe'

// What the navigation needs for the Public addresses page: shown behind the same gate as Exits and Proxy servers.
export function usePublicAddressesNav() {
  const { t } = useTranslation()
  return {
    title: t('navPage.publicAddresses', 'Public addresses'),
    to: PUBLIC_ADDRESSES_ROUTE,
    match: PUBLIC_ADDRESSES_ROUTE,
    icon: PUBLIC_ADDRESSES_ICON,
    shown: useDeviceSessions(),
  }
}
