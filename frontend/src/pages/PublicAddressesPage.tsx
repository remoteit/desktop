import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useReadCallback, useReadEffect } from '../hooks/useReadAgain'
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { endpointAddress, graphQLRemoveEndpoint } from '../services/graphQLProxy'
import { PublicAddress, PublicAddresses, graphQLPublicAddresses } from '../services/graphQLPublicAddresses'
import { expiresLine, kindLabel, openable, whoMayUse } from '../helpers/publicAddressWords'
import { TransferUsageHintText, useTransferUsageHint } from '../components/TransferUsage'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { NetworkSectionIntro } from '../components/NetworkSectionIntro'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { setPublicAddressCount } from '../components/ChooseOne'
import { windowOpen } from '../services/browser'

const KIND_ICON: Record<PublicAddress['kind'], string> = {
  https: 'globe',
  tcp: 'arrow-right-arrow-left',
  udp: 'wave-pulse',
}

/* Every public address across the account's services: the address, its service and device, who may use it, when it
   expires, and the account's proxy transfer this month where the API has it. Copy, open and remove each; Add public
   address starts from choosing a service (pages/PublicAddressAddPage.tsx). */
export const PublicAddressesPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const [read, setRead] = useState<PublicAddresses | 'ERROR' | typeof UNSUPPORTED>()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useReadCallback(async () => {
    setRead(await graphQLPublicAddresses(accountId))
  }, [accountId])

  useReadEffect(
    again => {
      if (!again) setRead(undefined)
      load()
    },
    [load]
  )

  const addresses = read && typeof read === 'object' ? read.addresses : []

  useEffect(() => {
    setPublicAddressCount(read && typeof read === 'object' ? read.addresses.length : undefined)
    return () => setPublicAddressCount(undefined)
  }, [read])
  const usage = useTransferUsageHint(
    accountId,
    'proxy',
    addresses.some(address => address.proxy.remoteit)
  )

  const remove = async (id: string, serviceId: string) => {
    setBusy(true)
    const result = await graphQLRemoveEndpoint(id, { about: [serviceId] })
    setFailed(result === 'ERROR')
    await load()
    setBusy(false)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <NetworkSectionIntro
          intro={t('publicAddresses.intro', 'Open your services from any browser or app, without installing anything.')}
          action={t('publicAddresses.add', 'Add public address')}
          to="/public-addresses/new"
        />
      }
    >
      {read === undefined ? (
        <LoadingMessage />
      ) : read === UNSUPPORTED ? (
        <Notice gutterTop>
          {t('publicAddresses.unsupported', 'Public addresses aren’t available on this server.')}
        </Notice>
      ) : read === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('publicAddresses.failed', 'Couldn’t load your public addresses. Try again.')}
        </Notice>
      ) : (
        <>
          {failed && (
            <Gutters>
              <Notice severity="error" fullWidth onClose={() => setFailed(false)}>
                {t('publicAddresses.notRemoved', 'Couldn’t remove the address. Try again.')}
              </Notice>
            </Gutters>
          )}
          {read.total > read.devices && (
            <Gutters>
              <Notice fullWidth data-partial>
                {t('publicAddresses.partial', 'Showing addresses for the first {{count}} of your {{total}} devices.', {
                  count: read.devices,
                  total: read.total,
                })}
              </Notice>
            </Gutters>
          )}
          {!addresses.length ? (
            <Gutters top="md" bottom="sm">
              <Typography variant="body2" color="textSecondary" data-empty>
                {t(
                  'publicAddresses.none',
                  'No public addresses yet. Add one to open a service from anywhere, and choose who may use it.'
                )}
              </Typography>
            </Gutters>
          ) : (
            <List data-addresses>
              {addresses.map(address => (
                <AddressRow key={address.id} address={address} busy={busy} onRemove={() => remove(address.id, address.service.id)} />
              ))}
            </List>
          )}
          {usage && (
            <Gutters>
              <Typography variant="caption" component="p" color="textSecondary">
                {t('publicAddresses.usage', 'Transfer through Remote.It proxy servers')}
              </Typography>
              <TransferUsageHintText hint={usage} />
            </Gutters>
          )}
        </>
      )}
    </Container>
  )
}

const AddressRow: React.FC<{ address: PublicAddress; busy: boolean; onRemove: () => void }> = ({
  address,
  busy,
  onRemove,
}) => {
  const { t } = useTranslation()
  const shown = endpointAddress(address)
  const actions = (
    <Box display="flex" marginLeft={-1} marginTop={0.5} data-actions>
      <CopyIconButton value={shown} title={t('publicAddresses.copy', 'Copy address')} />
      {openable(address) && (
        <IconButton
          icon="arrow-up-right"
          title={t('publicAddresses.open', 'Open')}
          onClick={() => windowOpen(address.url, '_blank', true)}
        />
      )}
      <ConfirmIconButton
        icon="trash"
        title={t('publicAddresses.remove', 'Remove')}
        disabled={busy}
        confirm
        confirmProps={{
          title: t('publicAddresses.removeTitle', 'Remove this public address?'),
          action: t('publicAddresses.remove', 'Remove'),
          color: 'error',
          children: t('publicAddresses.removeBody', '{{address}} stops working for everyone using it.', {
            address: shown,
          }),
        }}
        onClick={onRemove}
      />
    </Box>
  )
  return (
    <ListItem data-address={address.id} alignItems="flex-start" sx={{ paddingY: 1.5 }}>
      <ListItemIcon sx={{ marginTop: 0.75 }}>
        <Icon name={KIND_ICON[address.kind]} size="md" color="primary" fixedWidth />
      </ListItemIcon>
      <ListItemText
        primary={shown}
        primaryTypographyProps={{ sx: { wordBreak: 'break-all' } }}
        secondaryTypographyProps={{ component: 'div' }}
        sx={{ paddingRight: 2 }}
        secondary={
          <>
            <Typography variant="caption" component="div" color="textSecondary">
              <Link to={`/devices/${address.device.id}/${address.service.id}`} sx={{ padding: 0 }}>
                {address.service.name}
              </Link>
              {' · '}
              <Link to={`/devices/${address.device.id}`} sx={{ padding: 0 }}>
                {address.device.name}
              </Link>
              {' · '}
              {kindLabel(t, address.kind)}
            </Typography>
            <Typography variant="caption" component="div" color="textSecondary" data-who>
              {[
                whoMayUse(t, address),
                expiresLine(t, address),
                address.proxy.remoteit
                  ? ''
                  : t('publicAddresses.via', 'Through {{proxy}}', { proxy: address.proxy.name }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            {actions}
          </>
        }
      />
    </ListItem>
  )
}
