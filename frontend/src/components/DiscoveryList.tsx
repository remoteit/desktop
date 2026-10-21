import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material'
import { IP_PRIVATE } from '@common/constants'
import { State } from '../store'
import { findType } from '../models/applicationTypes'
import {
  Discovery,
  DiscoveryMachine,
  DiscoveryOffer,
  PRINTER_TYPE,
  byRank,
  groupDiscovery,
  machineLikely,
} from '../services/graphQLDiscovery'
import { ExpandIcon } from './ExpandIcon'
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

/* A row that opens what is behind it: "▸ 3 more", or a group of machines. */
const More: React.FC<{ label: React.ReactNode; inset?: boolean; group?: boolean; children: React.ReactNode }> = ({
  label,
  inset,
  group,
  children,
}) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ListItemButton dense data-more onClick={() => setOpen(!open)} sx={{ paddingLeft: inset ? 4 : undefined }}>
        <ListItemIcon>
          <ExpandIcon open={open} />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ variant: group ? 'body2' : 'caption', color: 'textSecondary' }}
        />
      </ListItemButton>
      {open && children}
    </>
  )
}

/* An offer list by rank: the likely ones, then "▸ N more" to the others and, under them dimmed, the ones not reachable
   remotely. Where none is likely, the others are the ones shown. */
const RankedOffers: React.FC<{
  offers: DiscoveryOffer[]
  inset?: boolean
  row: (offer: DiscoveryOffer, index: number) => React.ReactNode
}> = ({ offers, inset, row }) => {
  const { t } = useTranslation()
  const ranked = byRank(offers)
  const shown = ranked.likely.length ? ranked.likely : ranked.other
  const others = ranked.likely.length ? ranked.other : []
  const more = others.length + ranked.hidden.length
  return (
    <>
      {shown.map(row)}
      {!!more && (
        <More inset={inset} label={t('discovery.more', '{{n}} more', { n: more })}>
          {others.map(row)}
          {!!ranked.hidden.length && (
            <Box data-hidden sx={{ opacity: 0.5 }}>
              <ListSubheader disableSticky sx={{ paddingLeft: inset ? 4 : undefined, lineHeight: 2.5 }}>
                {t('discovery.notRemote', 'Not reachable remotely')}
              </ListSubheader>
              {ranked.hidden.map(row)}
            </Box>
          )}
        </More>
      )}
    </>
  )
}

/* What a device sees (services/graphQLDiscovery), as offers to add: its network's instances under the machine that
   advertises each, then what listens on the device itself. Each offer adds as a service through the add form. Ranked:
   what is likely wanted shown, the rest a click away; machines with nothing likely under the network's other devices. */
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

  // What it is, where that says more than its protocol: its type, else (plain TCP or UDP) what it advertises as.
  const kindOf = (offer: DiscoveryOffer) => {
    const name = typeName(offer)
    if (name.toLowerCase() !== offer.protocol.toLowerCase()) return name
    return offer.kind === 'network' ? offer.type : undefined
  }

  const portOf = (offer: DiscoveryOffer) => `${offer.protocol.toUpperCase()} ${offer.port}`

  // Its caveat, under its details.
  const withNote = (offer: DiscoveryOffer, secondary: string) =>
    offer.note ? (
      <>
        {secondary}
        <Typography component="span" variant="caption" display="block" color="textSecondary">
          {offer.note}
        </Typography>
      </>
    ) : (
      secondary
    )

  const offerRow = (offer: DiscoveryOffer, key: React.Key, primary: React.ReactNode, secondary: string) => {
    const added = offerAdded(offer, services)
    return (
      <ListItem
        key={key}
        dense
        sx={{ paddingLeft: offer.kind === 'network' ? 4 : undefined, paddingRight: 20 }}
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
        <ListItemText primary={primary} secondary={withNote(offer, secondary)} />
      </ListItem>
    )
  }

  const empty = !machines.length && !local.length
  const likely = machines.filter(machineLikely)
  const unlikely = machines.filter(machine => !machineLikely(machine))
  const offerKey = (offer: DiscoveryOffer) =>
    `${offer.host} ${offer.protocol} ${offer.port} ${offer.type} ${offer.name}`

  // A network instance: its label (an API before labels: its instance's name), its type and port.
  const networkRow = (machine: DiscoveryMachine) => (offer: DiscoveryOffer) =>
    offerRow(
      offer,
      offerKey(offer),
      offer.label || offer.name,
      (offer.label
        ? [offer.name !== machine.name && offer.name !== offer.label && offer.name, offer.type, portOf(offer)]
        : [kindOf(offer), portOf(offer)]
      )
        .concat(offer.host !== machine.key && offer.host)
        .filter(Boolean)
        .join(' · ')
    )

  // A listener: its label and port (an API before labels: its port), what listens and where.
  const localRow = (offer: DiscoveryOffer) =>
    offerRow(
      offer,
      offerKey(offer),
      offer.label ? `${offer.label} · ${portOf(offer)}` : portOf(offer),
      [offer.process || offer.name, !offer.label && kindOf(offer), offer.addresses.join(', ')]
        .filter(Boolean)
        .join(' · ')
    )

  const machineRows = (machine: DiscoveryMachine) => (
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
      <RankedOffers offers={machine.offers} inset row={networkRow(machine)} />
    </React.Fragment>
  )

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
          {likely.map(machineRows)}
          {!!unlikely.length && (
            <More
              group
              label={t('discovery.otherDevices', 'Other devices on the network ({{n}})', { n: unlikely.length })}
            >
              {unlikely.map(machineRows)}
            </More>
          )}
        </List>
      )}
      {!!local.length && (
        <List>
          <ListSubheader disableSticky>{t('discovery.local', 'On this device')}</ListSubheader>
          <RankedOffers offers={local} row={localRow} />
        </List>
      )}
    </>
  )
}
