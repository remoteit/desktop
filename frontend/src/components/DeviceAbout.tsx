import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItem, ListSubheader, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { DeviceAboutChange, DeviceAboutRead, graphQLDeviceAbout } from '../services/graphQLDeviceAbout'
import { Notice } from './Notice'
import { Timestamp } from './Timestamp'

type Row = [label: string, value: React.ReactNode]

/* What a device says it is (services/graphQLDeviceAbout) on its details page: System, Identifiers, the Product its
   manufacturer declares, its Software, and the History of every field. Behind the device-sessions flag; nothing where
   the API does not serve it or the device has said nothing (a legacy agent, or one from before `about`). */
export const DeviceAbout: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const [read, setRead] = useState<DeviceAboutRead | 'ERROR' | typeof UNSUPPORTED>()

  useEffect(() => {
    let current = true
    setRead(undefined)
    graphQLDeviceAbout(deviceId).then(result => current && setRead(result))
    return () => {
      current = false
    }
  }, [deviceId])

  if (!read || read === UNSUPPORTED || read === 'ERROR' || (!read.about && !read.history.length)) return null

  const { about, history } = read
  const os = about?.os
  const hw = about?.hardware
  const ids = about?.ids
  const oem = about?.oem
  const sw = about?.software

  const system: Row[] = [
    [t('deviceAbout.os', 'OS'), [os?.name, os?.version, os?.edition].filter(Boolean).join(' ')],
    [t('deviceAbout.build', 'Build'), os?.build],
    [t('deviceAbout.kernel', 'Kernel'), os?.kernel],
    [t('deviceAbout.manufacturer', 'Manufacturer'), hw?.manufacturer],
    [t('deviceAbout.model', 'Model'), hw?.model],
    [t('deviceAbout.board', 'Board'), hw?.board],
    [
      t('deviceAbout.cpu', 'CPU'),
      [hw?.cpu, hw?.cores && t('deviceAbout.cores', '{{count}} cores', { count: hw.cores })].filter(Boolean).join(', '),
    ],
    [t('deviceAbout.arch', 'Architecture'), hw?.arch],
    [t('deviceAbout.memory', 'Memory'), hw?.memoryMb ? memory(hw.memoryMb) : null],
    [t('deviceAbout.virtual', 'Virtual'), hw?.virtual && hw.virtual !== 'none' ? hw.virtual : null],
  ]
  const identifiers: Row[] = [
    [t('deviceAbout.serial', 'Serial'), ids?.serial],
    [t('deviceAbout.hardwareUuid', 'Hardware UUID'), ids?.hardwareUuid],
    [t('deviceAbout.machineId', 'Machine ID'), ids?.machineId !== ids?.hardwareUuid ? ids?.machineId : null],
    [t('deviceAbout.diskSerial', 'Boot disk serial'), ids?.diskSerial],
    [
      t('deviceAbout.macs', 'Network interfaces'),
      ids?.macs.length ? (
        <Box component="span">
          {ids.macs.map(m => (
            <Box key={m.interface + m.mac} component="span" sx={{ display: 'block' }}>
              {m.interface}{' '}
              <Typography component="span" variant="body2" color="grayDark.main">
                {m.mac}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null,
    ],
  ]
  const product: Row[] = [
    [
      t('deviceAbout.product', 'Product'),
      [oem?.productName, oem?.product && `(${oem.product})`].filter(Boolean).join(' '),
    ],
    [t('deviceAbout.manufacturer', 'Manufacturer'), oem?.manufacturer],
    [t('deviceAbout.model', 'Model'), oem?.model],
    [t('deviceAbout.hardwareRevision', 'Hardware revision'), oem?.hardwareRevision],
    [t('deviceAbout.firmware', 'Firmware'), oem?.firmware],
    [t('deviceAbout.serial', 'Serial'), oem?.serial],
  ]
  const software: Row[] = [
    [t('deviceAbout.agent', 'Agent'), sw?.connectd],
    [t('deviceAbout.package', 'Package'), [sw?.package, sw?.format && `(${sw.format})`].filter(Boolean).join(' ')],
  ]

  const changeText = (change: DeviceAboutChange) => {
    if (change.kind === 'update')
      return change.field === 'refused'
        ? t('deviceAbout.updateRefused', 'Refused the upgrade to {{version}}', { version: change.after })
        : t('deviceAbout.updateFailed', 'The upgrade to {{version}} failed', { version: change.after })
    return `${change.before ?? t('deviceAbout.nothing', 'nothing')} → ${
      change.after ?? t('deviceAbout.nothing', 'nothing')
    }`
  }

  return (
    <>
      {about?.hardwareChanged && (
        <Notice severity="warning" fullWidth>
          {t(
            'deviceAbout.hardwareChanged',
            'Its serial or hardware ID changed: this device ID may now be on other hardware — a copied image or SD card.'
          )}{' '}
          <Timestamp date={new Date(about.hardwareChanged)} variant="minutes" />
        </Notice>
      )}
      <Section title={t('deviceAbout.system', 'System')} rows={system} />
      <Section title={t('deviceAbout.identifiers', 'Identifiers')} rows={identifiers} />
      <Section title={t('deviceAbout.declaredProduct', 'Product — declared by the manufacturer')} rows={product} />
      <Section title={t('deviceAbout.software', 'Software')} rows={software} />
      {about && (
        <Typography variant="caption" color="grayDark.main" component="p" sx={{ paddingBottom: 1 }}>
          {t('deviceAbout.reported', 'As the device last reported it')}{' '}
          <Timestamp date={new Date(about.reported)} variant="minutes" />
        </Typography>
      )}
      {!!history.length && (
        <List dense>
          <ListSubheader disableGutters>{t('deviceAbout.history', 'History')}</ListSubheader>
          {history.map((change, index) => (
            <ListItem key={index} disableGutters sx={{ alignItems: 'flex-start' }}>
              <Box component="span" sx={{ color: 'grayDark.main', minWidth: 160 }}>
                <Timestamp date={new Date(change.at)} variant="minutes" />
              </Box>
              <Box component="span" sx={{ minWidth: 180, color: change.kind === 'update' ? 'danger.main' : undefined }}>
                {change.kind === 'update' ? t('deviceAbout.upgrade', 'Upgrade') : fieldLabel(change.field)}
              </Box>
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
                {changeText(change)}
                {change.detail && (
                  <Typography component="span" variant="body2" color="grayDark.main">
                    {' '}
                    — {change.detail}
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </>
  )
}

const Section: React.FC<{ title: string; rows: Row[] }> = ({ title, rows }) => {
  const shown = rows.filter(([, value]) => value != null && value !== '')
  if (!shown.length) return null
  return (
    <List dense sx={{ paddingBottom: 1 }}>
      <ListSubheader disableGutters>{title}</ListSubheader>
      {shown.map(([label, value]) => (
        <ListItem key={label} disableGutters sx={{ alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'grayDark.main', minWidth: 160 }}>
            {label}:
          </Box>
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
            {value}
          </Box>
        </ListItem>
      ))}
    </List>
  )
}

const memory = (mb: number) => (mb >= 1024 ? `${Math.round((mb / 1024) * 10) / 10} GB` : `${mb} MB`)

// A field's path, as a person reads it: os.version → "OS version"; the path itself for one not named here.
export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field
const FIELD_LABELS: ILookup<string> = {
  'os.family': 'OS family',
  'os.name': 'OS',
  'os.id': 'OS id',
  'os.version': 'OS version',
  'os.build': 'OS build',
  'os.kernel': 'Kernel',
  'os.edition': 'OS edition',
  'hardware.arch': 'Architecture',
  'hardware.cpu': 'CPU',
  'hardware.cores': 'Cores',
  'hardware.memory_mb': 'Memory (MB)',
  'hardware.manufacturer': 'Manufacturer',
  'hardware.model': 'Model',
  'hardware.board': 'Board',
  'hardware.virtual': 'Virtual',
  'ids.serial': 'Serial',
  'ids.hardware_uuid': 'Hardware UUID',
  'ids.machine_id': 'Machine ID',
  'ids.macs': 'Network interfaces',
  'ids.disk_serial': 'Boot disk serial',
  'oem.product': 'Product',
  'oem.product_name': 'Product name',
  'oem.manufacturer': 'Product manufacturer',
  'oem.model': 'Product model',
  'oem.hardware_revision': 'Hardware revision',
  'oem.firmware': 'Firmware',
  'oem.serial': 'Product serial',
  'software.connectd': 'Agent',
  'software.package': 'Package',
  'software.format': 'Package format',
}
