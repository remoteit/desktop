import React from 'react'
import { List, ListItem, ListItemText, Typography } from '@mui/material'
import { ThisDeviceModel } from './model'

/* This device's Details (pages/ThisDevicePage.tsx, /this-device/details): what there is to know of it, nothing to
   change — who owns it and who is signed in on it, how it is reached, what it runs, what it serves and the stages. */

const COPYABLE = { sx: { userSelect: 'all' as const } }

export const ThisDeviceDetails: React.FC<{ m: ThisDeviceModel }> = ({ m }) => {
  const { t, has, status, stages, lan } = m
  const d = status?.device
  const row = (key: string, primary: string, secondary?: string, copyable?: boolean) =>
    secondary ? (
      <ListItem key={key} data-detail={key}>
        <ListItemText primary={primary} secondary={secondary} secondaryTypographyProps={copyable ? COPYABLE : undefined} />
      </ListItem>
    ) : null

  return (
    <>
      {has('status') && status && (
        <List data-section="details">
          {row('name', t('thisDevice.name', 'Name'), d?.name)}
          {row('owner', t('thisDevice.owner', 'Owner'), d?.owner)}
          {row('signedIn', t('thisDevice.signedIn', 'Signed in on this device'), status.signedIn?.email || status.signedIn?.sub)}
          {row('dnsName', t('thisDevice.dnsName', 'Name on your network'), d?.dnsName, true)}
          {status.subnet?.on &&
            row(
              'address',
              t('thisDevice.address', 'Address'),
              [status.subnet.ipv4, status.subnet.ipv6].filter(Boolean).join(' · '),
              true
            )}
          {/* A shell before Access: the subnet as it was said then. */}
          {status.subnet &&
            !has('access') &&
            row(
              'subnet',
              t('thisDevice.subnet', 'Reach devices by name'),
              status.subnet.on
                ? [status.subnet.domain, status.subnet.ipv4, status.subnet.ipv6].filter(Boolean).join(' · ') ||
                    t('thisDevice.on', 'On')
                : t('thisDevice.off', 'Off')
            )}
          {row('uid', t('thisDevice.uid', 'UID'), d?.uid, true)}
          {row(
            'versions',
            t('thisDevice.versions', 'Versions'),
            [d?.package && t('thisDevice.package', 'Package {{v}}', { v: d.package }), d?.connectd && `connectd ${d.connectd}`]
              .filter(Boolean)
              .join(' · ')
          )}
          {row('stage', t('thisDevice.stage', 'Stage'), status.stage)}
          {status.relay &&
            row(
              'relay',
              t('thisDevice.relay', 'Relay'),
              status.relay.using
                ? t('thisDevice.relayUsing', 'In use now: this device’s traffic goes through remote.it’s relay')
                : t('thisDevice.relayNotUsing', 'Not in use: this device reaches remote.it directly')
            )}
        </List>
      )}

      {m.servicesVia && lan?.on && !!status?.served?.length && (
        <List data-section="served">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.served', 'Services')}
          </Typography>
          {status.served.map(s => (
            <ListItem key={s.service} data-served={s.service}>
              <ListItemText
                primary={s.target}
                secondary={[
                  t('thisDevice.servedConnections', 'Connections: {{n}}', { n: s.sessions }),
                  s.lastError && t('thisDevice.servedFailed', 'Last connection failed: {{error}}', { error: s.lastError }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </ListItem>
          ))}
        </List>
      )}

      {has('stages') && stages.length > 0 && (
        <List data-section="stages">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.stages', 'Stages')}
          </Typography>
          {stages.map(s => (
            <ListItem key={s.stage}>
              <ListItemText primary={s.stage} secondary={s.signedIn?.email ?? s.engine} />
            </ListItem>
          ))}
        </List>
      )}
    </>
  )
}
