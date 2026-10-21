import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography } from '@mui/material'
import { IP_PRIVATE } from '@common/constants'
import { State } from '../store'
import { findType } from '../models/applicationTypes'
import { Discovery, DiscoveryMachine, DiscoveryOffer, PRINTER_TYPE, groupDiscovery } from '../services/graphQLDiscovery'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  discovery: Discovery
  services: IService[]
  onAdd: (offer: DiscoveryOffer) => void
  // An action of a machine's own, on its header row (virtual devices: "Add as virtual device").
  machineAction?: (machine: DiscoveryMachine) => React.ReactNode
}

const LOOPBACK = ['127.0.0.1', '::1', 'localhost', IP_PRIVATE]

// Whether the device already serves it: a service at its host and port (a listener's at any loopback name).
export function offerAdded(offer: DiscoveryOffer, services: IService[]) {
  return services.some(
    service =>
      service.port === offer.port &&
      (service.host === offer.host ||
        (offer.kind === 'local' && LOOPBACK.includes(offer.host) && LOOPBACK.includes(service.host || '')))
  )
}

const ICONS: ILookup<string> = { 4: 'display', 5: 'display', 7: 'globe', 8: 'globe', 28: 'terminal', 34: 'folder' }

/* What a device sees (services/graphQLDiscovery), as offers to add: its network's instances under the machine that
   advertises each, then what listens on the device itself. Each offer adds as a service through the add form. */
export const DiscoveryList: React.FC<Props> = ({ discovery, services, onAdd, machineAction }) => {
  const { t } = useTranslation()
  const applicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const { machines, local } = groupDiscovery(discovery.offers)
  const withheld = (part: string) => discovery.withheld.includes(part)

  const typeName = (offer: DiscoveryOffer) => {
    if (offer.application === PRINTER_TYPE)
      return offer.tls ? t('discovery.printerTls', 'Printer (IPPS)') : t('discovery.printer', 'Printer')
    return findType(applicationTypes, offer.application).name
  }

  const offerRow = (offer: DiscoveryOffer, primary: React.ReactNode, secondary: React.ReactNode) => {
    const added = offerAdded(offer, services)
    return (
      <ListItem
        key={`${offer.kind}-${offer.host}-${offer.protocol}-${offer.port}-${offer.name}`}
        dense
        sx={{ paddingLeft: 4, paddingRight: 20 }}
        secondaryAction={
          added ? (
            <Button disabled size="small">
              {t('discovery.added', 'Added')}
              <Icon name="check" inline />
            </Button>
          ) : (
            <Button color="primary" variant="contained" size="small" onClick={() => onAdd(offer)}>
              {t('discovery.addAsService', 'Add as service')}
            </Button>
          )
        }
      >
        <ListItemIcon>
          <Icon name={offer.application === PRINTER_TYPE ? 'print' : ICONS[offer.application] || 'plug'} size="md" />
        </ListItemIcon>
        <ListItemText primary={primary} secondary={secondary} />
      </ListItem>
    )
  }

  const empty = !machines.length && !local.length

  return (
    <>
      {withheld('network') && (
        <Notice gutterBottom>
          {t('discovery.withheldNetwork', "This device's local policy doesn't share what its network advertises")}
        </Notice>
      )}
      {withheld('local') && (
        <Notice gutterBottom>
          {t('discovery.withheldLocal', "This device's local policy doesn't share what listens on it")}
        </Notice>
      )}
      {empty && (
        <Typography variant="body2" color="textSecondary" sx={{ padding: 2 }}>
          {t('discovery.nothing', 'Nothing to add: the device sees no advertised services and nothing listening.')}
        </Typography>
      )}
      {!!machines.length && (
        <List>
          <ListSubheader disableSticky>{t('discovery.network', 'On its network')}</ListSubheader>
          {machines.map(machine => (
            <React.Fragment key={machine.key}>
              <ListItem secondaryAction={machineAction?.(machine)}>
                <ListItemIcon>
                  <Icon name="laptop" size="md" color="grayDark" />
                </ListItemIcon>
                <ListItemText
                  primary={machine.name}
                  secondary={[machine.key !== machine.name && machine.key, machine.addresses.join(', ')]
                    .filter(Boolean)
                    .join(' · ')}
                />
              </ListItem>
              {machine.offers.map(offer =>
                offerRow(
                  offer,
                  offer.name,
                  <Box component="span">
                    {typeName(offer)} · {offer.protocol.toUpperCase()} {offer.port}
                    {offer.host !== machine.key && ` · ${offer.host}`}
                  </Box>
                )
              )}
            </React.Fragment>
          ))}
        </List>
      )}
      {!!local.length && (
        <List>
          <ListSubheader disableSticky>{t('discovery.local', 'On this device')}</ListSubheader>
          {local.map(offer =>
            offerRow(
              offer,
              `${offer.protocol.toUpperCase()} ${offer.port}`,
              [offer.process || offer.name, typeName(offer), offer.addresses.join(', ')].filter(Boolean).join(' · ')
            )
          )}
        </List>
      )}
    </>
  )
}
