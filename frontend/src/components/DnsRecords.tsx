import React from 'react'
import type { TFunction } from 'i18next'
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { ProxyNameRecord } from '../services/graphQLProxy'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { Icon } from './Icon'

/* Records an owner adds where their DNS is hosted, and how remote.it found each at its last check: a proxy's own name's
   three CNAMEs (components/ProxyOwnName.tsx), an account base's NS records (pages/ProxyBasePage.tsx). */

// A name as typed: trimmed, lower case, without the root's trailing dot.
export const dnsNameOf = (value: string) => value.trim().toLowerCase().replace(/\.$/, '')

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

// Why a name cannot be one under a domain, as far as it can be told here: not DNS labels — letters, digits and hyphens,
// joined by dots —, or fewer than three, as a domain itself has. Whether it is under a domain (example.co.uk has three
// labels, and is one) is graphql's to say, in its words.
export function dnsNameShape(name: string): 'shape' | 'domain' | undefined {
  const labels = name.split('.')
  if (name.length > 253 || !labels.every(label => LABEL.test(label))) return 'shape'
  if (labels.length < 3) return 'domain'
  return undefined
}

// Each record as the last check found it.
export const recordState = (record: ProxyNameRecord): 'found' | 'missing' | 'wrong' =>
  record.found ? 'found' : record.seen ? 'wrong' : 'missing'

// The records to add: each one's name and value with a copy button, its type, and what the last check found. Several
// may share a name (NS records): each row is its value's too.
export const DnsRecords: React.FC<{ t: TFunction; records: ProxyNameRecord[] } & Record<`data-${string}`, unknown>> = ({
  t,
  records,
  ...data
}) => (
  <Box sx={{ overflowX: 'auto', width: '100%' }}>
    <Table size="small" {...data}>
      <TableHead>
        <TableRow>
          <TableCell>{t('ownName.recordName', 'Name')}</TableCell>
          <TableCell>{t('ownName.recordType', 'Type')}</TableCell>
          <TableCell>{t('ownName.recordValue', 'Value')}</TableCell>
          <TableCell>{t('ownName.recordState', 'State')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {records.map(record => {
          const state = recordState(record)
          return (
            <TableRow
              key={`${record.type} ${record.name} ${record.value}`}
              data-record={record.name}
              data-record-value={record.value}
              data-record-state={state}
            >
              <TableCell>
                <DnsName value={record.name} title={t('ownName.copyName', 'Copy the name')} />
              </TableCell>
              <TableCell>{record.type}</TableCell>
              <TableCell>
                <DnsName value={record.value} title={t('ownName.copyValue', 'Copy the value')} />
              </TableCell>
              <TableCell data-record-found sx={{ whiteSpace: state === 'wrong' ? undefined : 'nowrap' }}>
                <Icon
                  name={state === 'found' ? 'check' : state === 'wrong' ? 'times' : 'minus'}
                  color={state === 'found' ? 'success' : state === 'wrong' ? 'danger' : 'warning'}
                  size="sm"
                  inlineLeft
                />
                {state === 'found'
                  ? t('ownName.found', 'Found')
                  : state === 'wrong'
                  ? t('ownName.wrong', 'Wrong: answers {{seen}}', { seen: record.seen })
                  : t('ownName.missing', 'Missing')}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </Box>
)

// A DNS name, wrapping where it must after a dot, with its copy button beside it.
export const DnsName: React.FC<{ value: string; title: string }> = ({ value, title }) => (
  <Box display="flex" alignItems="center">
    <Box component="span">
      {value.split('.').map((label, n) => (
        <React.Fragment key={n}>
          {n > 0 && (
            <>
              .<wbr />
            </>
          )}
          {label}
        </React.Fragment>
      ))}
    </Box>
    <CopyIconButton value={value} title={title} size="sm" />
  </Box>
)
