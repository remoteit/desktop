import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography } from '@mui/material'
import {
  OwnNameMove,
  Proxy,
  ProxyOwnName as OwnName,
  graphQLRemoveProxyName,
  graphQLSetProxyName,
  graphQLVerifyProxyName,
} from '../services/graphQLProxy'
import { useAccountAdmin } from '../hooks/useAccountAdmin'
import { DnsRecords, dnsNameOf, dnsNameShape, recordState } from './DnsRecords'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ListItemSetting } from './ListItemSetting'
import { LoadingMessage } from './LoadingMessage'
import { Timestamp } from './Timestamp'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Link } from './Link'

type Props = {
  proxy: Proxy // an own proxy, for whoever manages it
  busy: boolean // a change being made on its page: nothing else can be meanwhile
  onBusy: (busy: boolean) => void
  onChanged: () => Promise<Proxy | undefined> // the proxy read again, and what was read
}

// Room beside a line for its button, so a long line wraps before it, never under it.
const BUTTON_ROOM = '120px'

// A move said first, then made on a confirm: its addresses under the name (its records right), or back to remote.it's
// names. What a check said already is not asked again.
type Moving = { mode: 'verify' | 'remove'; said?: OwnNameMove }

/* An own proxy's own name (graphql-api docs/PROXY-GROUPS.md §14, decision 48), free, for whoever manages it: a name
   under a domain its owner controls, office.example.com — never example.com itself. Claimed, it is pending, with the
   three records to add where its DNS is hosted, each with its copy buttons and what the last check found of it —
   found, missing, or wrong with what DNS answered instead. Check now checks them at once; found right (verified), what
   moving its addresses under the name does is said, from the check's answer, and made once confirmed (active: the
   name and its certificate said). A record gone or wrong after that is named, and that its certificate's renewal fails
   until it is right (broken). Remove says first what moves back to remote.it's names, then moves it. A refusal is said
   in graphql's words. A name given by the account's base is said, read only (BaseGivenName). */
export const ProxyOwnName: React.FC<Props> = props =>
  props.proxy.ownName?.via === 'base' ? (
    <BaseGivenName proxy={props.proxy} own={props.proxy.ownName} />
  ) : (
    <OwnNameClaim {...props} />
  )

const OwnNameClaim: React.FC<Props> = ({ proxy, busy, onBusy, onChanged }) => {
  const { t } = useTranslation()
  const own = proxy.ownName ?? null
  const [notice, setNotice] = useState<string>()
  const [moving, setMoving] = useState<Moving>()
  // Its addresses are under the name: it is changed only once they are moved back (Remove).
  const serving = own?.state === 'active' || own?.state === 'broken'

  // A name saved as it stands is no change; emptied, it is given up — what moves back said first.
  const claim = async (value: string) => {
    const name = ownNameOf(value)
    if (name === (own?.name ?? '')) return
    if (!name) return setMoving({ mode: 'remove' })
    onBusy(true)
    const said = await graphQLSetProxyName(proxy.id, name)
    setNotice('reason' in said ? said.reason || t('ownName.notSet', 'It was not set: try again.') : undefined)
    await onChanged()
    onBusy(false)
  }

  // Its records checked now, and read again to show what was found. Right, and its addresses not moved yet: what moves
  // is said from the check's answer, to be confirmed.
  const check = async () => {
    onBusy(true)
    const said = await graphQLVerifyProxyName(proxy.id, false)
    const read = await onChanged()
    onBusy(false)
    if ('reason' in said)
      return setNotice(said.reason || t('ownName.notChecked', 'Its records could not be checked: try again.'))
    setNotice(undefined)
    if (read?.ownName?.state === 'verified') setMoving({ mode: 'verify', said })
  }

  return (
    <List data-own-name={own?.state ?? 'none'}>
      <ListSubheader>{t('ownName.title', 'Own name')}</ListSubheader>
      {serving && own ? (
        <ListItemSetting
          icon="earth-americas"
          label={own.name}
          subLabel={t('ownName.serving', 'Its own name: to use another, remove this one first')}
        />
      ) : (
        <InlineTextFieldSetting
          icon="earth-americas"
          label={t('ownName.label', 'DNS name')}
          value={own?.name ?? ''}
          placeholder={t('ownName.placeholder', 'none: a name under your domain, as office.example.com')}
          filter={/[^a-zA-Z0-9.-]/g}
          maxLength={253}
          disabled={busy}
          validate={value => (ownNameOf(value) ? ownNameProblem(t, ownNameOf(value)) : undefined)}
          onSave={value => claim(String(value))}
        />
      )}
      {own && <StateLine t={t} own={own} busy={busy} onCheck={check} />}
      {own && serving && own.certificate && (
        <ListItemSetting
          icon="file-certificate"
          iconColor={own.certificate === 'ready' ? 'success' : own.certificate === 'failed' ? 'danger' : 'warning'}
          label={ownCertificateLine(t, own.certificate)}
          subLabel={t('ownName.certificate', 'Its certificate under {{name}}', { name: own.name })}
        />
      )}
      <ListItem>
        <ListItemIcon />
        <ListItemText
          secondary={
            own?.state === 'active'
              ? t(
                  'ownName.keep',
                  'Keep these records where your DNS is hosted: remote.it renews its certificate through them.'
                )
              : t(
                  'ownName.hint',
                  'Use a name under a domain you control. Add these records where your DNS is hosted; remote.it checks them and keeps the certificate renewed.'
                )
          }
        />
      </ListItem>
      {!!own?.records.length && (
        <ListItem>
          <DnsRecords t={t} records={own.records} data-own-name-records />
        </ListItem>
      )}
      {notice && (
        <ListItem>
          <Notice severity="error" fullWidth onClose={() => setNotice(undefined)}>
            {notice}
          </Notice>
        </ListItem>
      )}
      {own?.state === 'verified' && (
        <ListItemSetting
          icon="circle-arrow-right"
          label={t('ownName.move', 'Move its addresses under {{name}}', { name: own.name })}
          subLabel={t('ownName.moveHint', 'What moves is said first')}
          button={t('ownName.moveButton', 'Move')}
          buttonDisabled={busy}
          secondaryContentWidth={BUTTON_ROOM}
          onButtonClick={() => setMoving({ mode: 'verify' })}
        />
      )}
      {own && (
        <ListItemSetting
          icon="rotate-left"
          label={t('ownName.remove', 'Remove its own name')}
          subLabel={t('ownName.removeHint', 'What moves back to remote.it’s names is said first')}
          button={t('ownName.removeButton', 'Remove')}
          buttonDisabled={busy}
          secondaryContentWidth={BUTTON_ROOM}
          onButtonClick={() => setMoving({ mode: 'remove' })}
        />
      )}
      {moving && own && (
        <OwnNameMoveDialog
          proxy={proxy}
          name={own.name}
          {...moving}
          onClose={() => setMoving(undefined)}
          onMoved={async () => {
            setMoving(undefined)
            setNotice(undefined)
            onBusy(true)
            await onChanged()
            onBusy(false)
          }}
        />
      )}
    </List>
  )
}

/* A name its account's base gave it, <label>.<base>: said read only — no records of its own, neither set nor removed
   here —, under which base, linked to the base's page for an admin of the account (pages/ProxyBasePage.tsx); its
   certificate, the base's, and anything not right with it, which is the base's to put right. */
const BaseGivenName: React.FC<{ proxy: Proxy; own: OwnName }> = ({ proxy, own }) => {
  const { t } = useTranslation()
  const admin = useAccountAdmin(proxy.owner?.id ?? null)
  const base = baseOf(own.name)
  const serving = own.state === 'active' || own.state === 'broken'
  return (
    <List data-own-name={own.state} data-own-name-via="base">
      <ListSubheader>{t('ownName.title', 'Own name')}</ListSubheader>
      <ListItemSetting
        icon="sitemap"
        label={own.name}
        subLabel={
          <span data-own-name-base={base}>
            {t('ownName.base', 'Named under your account’s base')}{' '}
            {admin ? (
              <Link to="/proxies/base" data-own-name-base-link>
                {base}
              </Link>
            ) : (
              base
            )}
          </span>
        }
      />
      {own.state !== 'active' && (
        <ListItemSetting
          icon={own.state === 'broken' ? 'triangle-exclamation' : 'hourglass'}
          iconColor={own.state === 'broken' ? 'danger' : 'warning'}
          label={
            own.state === 'broken'
              ? t('ownName.baseBroken', 'Broken: the account’s base needs its records put right')
              : t('ownName.baseWaiting', 'Not under it yet: the account’s base is not active')
          }
          subLabel={own.problem ?? undefined}
        />
      )}
      {serving && own.certificate && (
        <ListItemSetting
          icon="file-certificate"
          iconColor={own.certificate === 'ready' ? 'success' : own.certificate === 'failed' ? 'danger' : 'warning'}
          label={ownCertificateLine(t, own.certificate)}
          subLabel={[
            t('ownName.certificate', 'Its certificate under {{name}}', { name: own.name }),
            // Active, what graphql says is wrong is its certificate's: why it was not issued.
            own.state === 'active' ? own.problem : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      )}
      <ListItem>
        <ListItemIcon />
        <ListItemText
          secondary={t(
            'ownName.baseHint',
            'remote.it keeps its records and certificate under the account’s base: nothing to add where your DNS is hosted.'
          )}
        />
      </ListItem>
    </List>
  )
}

// The base a name it gave is one label under.
export const baseOf = (name: string) => name.slice(name.indexOf('.') + 1)

// A name as typed: trimmed, lower case, without the root's trailing dot.
export const ownNameOf = dnsNameOf

// Why a name cannot be an own name, as far as it can be told here: DNS labels — letters, digits and hyphens, joined by
// dots —, three at least, as a name one label under a domain has. Whether it is under a domain, not one itself
// (example.co.uk has three labels, and is one), is graphql's to say, in its words.
export function ownNameProblem(t: TFunction, name: string): string | undefined {
  const shape = dnsNameShape(name)
  if (shape === 'shape') return t('ownName.problemShape', 'Letters, digits and hyphens, in parts joined by dots')
  if (shape === 'domain')
    return t('ownName.problemDomain', 'A name under your domain, as office.example.com: not the domain itself')
  return undefined
}

export { recordState }

// Where it stands, with the last check, any problem graphql says, and Check now: pending, with how many records are
// found; verified; active; broken, naming each record gone or wrong, and its certificate's renewal failing until then.
const StateLine: React.FC<{ t: TFunction; own: OwnName; busy: boolean; onCheck: () => void }> = ({
  t,
  own,
  busy,
  onCheck,
}) => {
  const found = own.records.filter(record => record.found).length
  const wrong = own.records
    .filter(record => !record.found)
    .map(record =>
      record.seen
        ? t('ownName.recordWrong', '{{name}} is wrong: it answers {{seen}}', { name: record.name, seen: record.seen })
        : t('ownName.recordMissing', '{{name}} is missing', { name: record.name })
    )
  const line = {
    pending: {
      icon: 'hourglass',
      color: 'warning' as const,
      label: t('ownName.pending', 'Pending: {{found}} of {{total}} records found', {
        found,
        total: own.records.length,
      }),
      hint: t('ownName.pendingHint', 'Add them, then check them'),
    },
    verified: {
      icon: 'badge-check',
      color: 'success' as const,
      label: t('ownName.verified', 'Verified: its records are right'),
      hint: t('ownName.verifiedHint', 'Its addresses move under it once you confirm'),
    },
    active: {
      icon: 'circle-check',
      color: 'success' as const,
      label: t('ownName.active', 'Active: its endpoints are reached under it'),
      hint: '',
    },
    broken: {
      icon: 'triangle-exclamation',
      color: 'danger' as const,
      label: wrong.length
        ? t('ownName.broken', 'Broken: {{records}}', { records: wrong.join('; ') })
        : t('ownName.brokenNone', 'Broken'),
      hint: t(
        'ownName.brokenHint',
        'It keeps serving until its certificate needs renewing, and the renewal fails until its records are right'
      ),
    },
  }[own.state] ?? { icon: 'hourglass', color: 'warning' as const, label: own.state, hint: '' }
  return (
    <ListItemSetting
      icon={line.icon}
      iconColor={line.color}
      label={line.label}
      subLabel={
        <span data-own-name-hint>
          {[line.hint, own.problem]
            .filter(Boolean)
            .map(part => `${part} · `)
            .join('')}
          {own.checked ? (
            <>
              {t('ownName.checked', 'Checked')} <Timestamp date={new Date(own.checked)} />
            </>
          ) : (
            t('ownName.notCheckedYet', 'Not checked yet')
          )}
        </span>
      }
      button={t('ownName.check', 'Check now')}
      buttonDisabled={busy}
      secondaryContentWidth={BUTTON_ROOM}
      onButtonClick={onCheck}
    />
  )
}

// The own name's certificate, remote.it's to issue and renew through its records.
export function ownCertificateLine(t: TFunction, certificate: OwnName['certificate']): string {
  if (certificate === 'ready') return t('ownName.certificateReady', 'Issued: remote.it renews it')
  if (certificate === 'failed')
    return t('ownName.certificateFailed', 'Not issued: until it is, its https endpoints under it are not served')
  return t('ownName.certificatePending', 'Not issued yet: until it is, its https endpoints under it are not served')
}

// The certificate its https endpoints are served with after a move: the own name's moving under it, the stage's moving
// back.
export function moveCertificateLine(
  t: TFunction,
  mode: Moving['mode'],
  certificate: OwnNameMove['certificate'],
  name: string
): string {
  if (mode === 'remove')
    return certificate === 'ready'
      ? t('proxyPage.namesReady', 'Its https endpoints are served with remote.it’s certificate for every proxy name.')
      : t(
          'proxyPage.namesPending',
          'remote.it’s certificate for every proxy name is not issued yet: until it is, its https endpoints are not served.'
        )
  if (certificate === 'ready')
    return t('ownName.moveReady', 'Its https endpoints are served with the certificate for {{name}}.', { name })
  if (certificate === 'failed')
    return t(
      'ownName.moveFailed',
      'The certificate for {{name}} could not be issued: until it is, its https endpoints are not served.',
      { name }
    )
  return t(
    'ownName.movePending',
    'The certificate for {{name}} is not issued yet: until it is, its https endpoints are not served.',
    { name }
  )
}

/* Its addresses moved under its own name, or back to remote.it's names: every endpoint address before and after, and
   the certificate after, said first — from a check's answer where there is one, else asked — then moved once
   confirmed. A refusal is said in graphql's words, and nothing moves. */
const OwnNameMoveDialog: React.FC<
  Moving & { proxy: Proxy; name: string; onClose: () => void; onMoved: () => void }
> = ({ proxy, name, mode, said: given, onClose, onMoved }) => {
  const { t } = useTranslation()
  const [said, setSaid] = useState<OwnNameMove | { reason: string } | undefined>(given)
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const ask = (apply: boolean) =>
    mode === 'verify' ? graphQLVerifyProxyName(proxy.id, apply) : graphQLRemoveProxyName(proxy.id, apply)

  useEffect(() => {
    if (!given) ask(false).then(setSaid)
  }, [])

  const move = async () => {
    setBusy(true)
    const done = await ask(true)
    setBusy(false)
    if ('reason' in done) return setRefusal(done.reason || t('ownName.notMoved', 'Nothing was moved: try again.'))
    onMoved()
  }

  const preview = said && !('reason' in said) ? said : undefined
  return (
    <Confirm
      open
      maxWidth="sm"
      title={
        mode === 'verify'
          ? t('ownName.moveTitle', 'Move {{proxy}} under {{name}}?', { proxy: proxy.name, name })
          : t('ownName.removeTitle', 'Remove {{name}} from {{proxy}}?', { proxy: proxy.name, name })
      }
      action={mode === 'verify' ? t('ownName.moveButton', 'Move') : t('ownName.removeButton', 'Remove')}
      color="error"
      disabled={busy || !preview || !!refusal}
      onConfirm={move}
      onDeny={onClose}
    >
      {said === undefined ? (
        <LoadingMessage />
      ) : 'reason' in said ? (
        <Notice severity="error" fullWidth>
          {said.reason || t('proxyPage.namesUnsaid', 'What it would do could not be said: try again.')}
        </Notice>
      ) : (
        <>
          <Typography variant="body2" gutterBottom data-own-name-certificate>
            {moveCertificateLine(t, mode, said.certificate, name)}
          </Typography>
          {said.addresses.length ? (
            <List dense data-own-name-addresses>
              {said.addresses.map(address => (
                <ListItem key={address.endpoint} disableGutters>
                  <ListItemText primary={address.to} secondary={t('proxyPage.moveFrom', 'was {{from}}', address)} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2">{t('proxyPage.namesNoAddresses', 'No endpoint address moves.')}</Typography>
          )}
        </>
      )}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}
