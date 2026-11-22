import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import browser, { openServiceURL } from '../services/browser'
import { newConnection } from '../helpers/connectionHelper'
import { Endpoint, graphQLCreateEndpoint, graphQLServiceEndpoints } from '../services/graphQLProxy'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { ComboButton } from '../buttons/ComboButton'
import { ErrorButton } from '../buttons/ErrorButton'
import { refreshEndpoints } from './EndpointsAccordion'
import { ConnectRoute, ConnectRouteVariant } from './ConnectRoute'
import { Confirm } from './Confirm'

type Props = {
  variant: ConnectRouteVariant
  device?: IDevice
  service: IService
  connection: IConnection
  permissions?: IPermission[]
  reverseProxy: boolean // a web service: its connection's address is open to anyone with it
  signedInAddresses: boolean // the API makes public addresses that ask visitors to sign in
  showError?: boolean
  onToggleError?: () => void
}

// The person's own: a temporary web address that asks everyone to sign in, made once and opened again after that.
export const signedInAddress = (endpoints: Endpoint[]) =>
  endpoints.find(endpoint => endpoint.kind === 'https' && endpoint.access === 'signed-in')

/** Connecting through a public address. A web service from a browser opens at a public address that asks visitors to
 *  sign in. Otherwise the connection's own address, which anyone with it can open while it is on for a web service:
 *  said first, and only then made. */
export const PublicAddressConnect: React.FC<Props> = ({
  variant,
  device,
  service,
  connection,
  permissions,
  reverseProxy,
  signedInAddresses,
  showError,
  onToggleError,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [address, setAddress] = useState<string>()
  const [unsupported, setUnsupported] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const label = t('publicConnect.label', 'Connect through a public address')

  const viaSignedIn =
    reverseProxy && signedInAddresses && !unsupported && !browser.hasBackend && !!device && !connection.enabled

  const openSignedIn = async () => {
    if (!device) return
    setBusy(true)
    setFailed(false)
    // Reserved on the click: the popup blocker allows no tab opened after the requests.
    const tab = browser.isNative ? null : window.open('', '_blank')
    const listed = await graphQLServiceEndpoints(device.id, service.id)
    if (listed === UNSUPPORTED) {
      tab?.close()
      setUnsupported(true)
      setBusy(false)
      return
    }
    let url = Array.isArray(listed) ? signedInAddress(listed)?.url : undefined
    if (!url) {
      const created = await graphQLCreateEndpoint(service.id, {
        kind: 'https',
        access: 'signed-in',
        lifetime: 'temporary',
      })
      url = created === 'ERROR' ? undefined : created?.data?.data?.createEndpoint?.url
      if (url) refreshEndpoints(service.id)
    }
    setBusy(false)
    if (!url) {
      tab?.close()
      setFailed(true)
      return
    }
    setAddress(url)
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else openServiceURL(url)
  }

  if (viaSignedIn)
    return (
      <ConnectRoute
        variant={variant}
        icon="globe"
        label={variant === 'primary' ? t('connectRoute.openBrowser', 'Open in browser') : label}
        how={
          variant === 'primary'
            ? t('publicConnect.signedInHow', 'Through a public address. Visitors sign in with Remote.It.')
            : t('publicConnect.signedInLine', 'Opens in a new tab. Visitors sign in with Remote.It.')
        }
        address={address}
        onClick={openSignedIn}
        loading={busy}
        disabled={!permissions?.includes('CONNECT')}
        error={failed && t('publicConnect.failed', "Couldn't create a public address. Try again.")}
      />
    )

  const isPublic = !browser.hasBackend || connection.public
  const askFirst = isPublic && reverseProxy && !connection.enabled && !connection.connecting && !connection.connectLink
  const how = !isPublic
    ? t('publicConnect.desktopHow', 'Starts a connection from this computer.')
    : reverseProxy
    ? t('publicConnect.openLine', 'Anyone with the address can open it while it is on.')
    : t('publicConnect.latchLine', 'Only the first device to connect can use it.')

  const connect = async () => {
    setConfirming(false)
    await dispatch.connections.connect({ ...(connection || newConnection(service)), connectOnReady: true })
    await dispatch.networks.join(service.id)
  }

  return (
    <ConnectRoute
      variant={variant}
      icon="cloud"
      label={label}
      how={
        variant === 'primary' && isPublic ? `${t('publicConnect.through', 'Through a public address.')} ${how}` : how
      }
      button={
        <>
          {variant === 'primary' && onToggleError && (
            <ErrorButton connection={connection} onClick={onToggleError} visible={!!showError} />
          )}
          <ComboButton
            size={variant === 'primary' ? 'large' : 'small'}
            iconType="solid"
            service={service}
            connection={connection}
            permissions={permissions}
            fullWidth={variant === 'primary'}
            preventDefault={askFirst}
            onClick={askFirst ? () => setConfirming(true) : undefined}
          />
        </>
      }
    >
      <Confirm
        open={confirming}
        title={t('publicConnect.confirmTitle', 'Open to anyone with the address?')}
        action={t('publicConnect.confirmAction', 'Create public address')}
        onConfirm={connect}
        onDeny={() => setConfirming(false)}
      >
        {t('publicConnect.confirmBody', 'Anyone who has the address can open {{service}} until the connection ends.', {
          service: service.name,
        })}
      </Confirm>
    </ConnectRoute>
  )
}
