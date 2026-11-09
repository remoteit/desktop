import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { State } from '../store'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  AccountProxyBase,
  BaseMove,
  graphQLProxyBase,
  graphQLRemoveAccountProxyBase,
  graphQLSetAccountProxyBase,
  graphQLVerifyAccountProxyBase,
} from '../services/graphQLProxy'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectLimitsLookup } from '../selectors/organizations'
import { useAccountAdmin } from '../hooks/useAccountAdmin'
import { useAccountProxies, useAccountProxyBase } from '../hooks/useAccountExits'
import { baseLine, baseMoveCertificateLine } from '../helpers/proxyBaseHelper'
import { DnsRecords, dnsNameOf, dnsNameShape } from '../components/DnsRecords'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { Container } from '../components/Container'
import { BillingUI } from '../components/BillingUI'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { PROXY_BASE_LIMIT } from '../constants'

// The limit that includes a base (PROXY_BASE_LIMIT: the Enterprise plan's, or the Proxy base add-on licence's): an account
// whose limits do not give it — absent is off, as every feature's — has none, said before anything is typed. Until the
// account's limits are read, graphql says, refusing a plan without it in its words.
export { PROXY_BASE_LIMIT }

// Room beside a line for its button, so a long line wraps before it, never under it.
const BUTTON_ROOM = '120px'

// A move said first, then made on a confirm: the account's proxies under the base (its delegation seen), or back to
// their names before. What a check said already is not asked again.
type Moving = { mode: 'verify' | 'remove'; said?: BaseMove }

/* The account's base for its proxies' names (graphql-api docs/PROXY-GROUPS.md §14, decision 48, wave 3b), on the
   Proxies page's side (/proxies/base), for an admin of the account the portal is acting as: a paid feature — said
   plainly before anything; to an account whose plan does not include it, only that, with no form —, one per account.
   A subdomain the account controls, proxies.example.com, is entered and claimed: pending — another may take its place
   until its delegation is seen —, with the NS records to add where its DNS is hosted, each with its copy buttons and
   what the last check found of it — found, missing, or wrong with what DNS answered instead —, and its name servers to
   copy at once. Check now checks the delegation at once; seen (verified), what moves is said proxy by proxy, from the
   check's answer, and moved once confirmed (active: the base, how many proxies are named under it, and what that
   means). A record gone or wrong after that is named (broken). Remove says first which proxies move back, then moves
   them and deletes its zone. A refusal is said in graphql's words. */
export const ProxyBasePage: React.FC = () => {
  const accountId = useSelector(selectActiveAccountId)
  // Another account's base starts afresh: a dialog opened on one never acts on the next.
  return <AccountBase key={accountId} accountId={accountId} />
}

const AccountBase: React.FC<{ accountId: string }> = ({ accountId }) => {
  const { t } = useTranslation()
  const admin = useAccountAdmin()
  const limits = useSelector((state: State) => selectLimitsLookup(state, accountId))
  const limitsRead = useSelector((state: State) => state.organization.initialized)
  const included = !limitsRead || !!limits[PROXY_BASE_LIMIT]
  const [base, setBase] = useState<AccountProxyBase | null | 'ERROR' | typeof UNSUPPORTED>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [moving, setMoving] = useState<Moving>()
  const { reload: reloadEntry } = useAccountProxyBase()
  const { reload: reloadProxies } = useAccountProxies()
  const reads = useRef(0)

  // Only the last read asked for is shown: one answered late never overwrites a newer one. What was read is answered.
  const load = useCallback(async () => {
    const read = ++reads.current
    const answer = await graphQLProxyBase(accountId)
    if (read === reads.current) setBase(answer)
    return answer
  }, [accountId])

  useEffect(() => {
    if (admin) load()
  }, [admin, load])

  // The base read again after a change, and the Proxies page's line for it.
  const refresh = async () => {
    reloadEntry()
    const answer = await load()
    return answer && typeof answer === 'object' ? answer : null
  }

  const current = base && typeof base === 'object' ? base : null
  // Verified, or its proxies under it: it is changed only once it is removed (Remove). A pending one is replaced.
  const fixed = !!current && current.state !== 'pending'

  // A base saved as it stands is no change; emptied, a pending one is given up — what that does said first.
  const claim = async (value: string) => {
    const name = dnsNameOf(value)
    if (name === (current?.base ?? '')) return
    if (!name) return setMoving({ mode: 'remove' })
    setBusy(true)
    const said = await graphQLSetAccountProxyBase(accountId, name)
    setNotice('reason' in said ? said.reason || t('proxyBase.notSet', 'It was not set: try again.') : undefined)
    await refresh()
    setBusy(false)
  }

  // Its delegation checked now, and the base read again to show what was found. Seen, and its proxies not moved yet:
  // what moves is said from the check's answer, to be confirmed.
  const check = async () => {
    setBusy(true)
    const said = await graphQLVerifyAccountProxyBase(accountId, false)
    const read = await refresh()
    setBusy(false)
    if ('reason' in said)
      return setNotice(said.reason || t('proxyBase.notChecked', 'Its delegation could not be checked: try again.'))
    setNotice(undefined)
    if (read?.state === 'verified') setMoving({ mode: 'verify', said })
  }

  // Moved: the base and the account's proxies — their names — read again.
  const moved = async () => {
    setMoving(undefined)
    setNotice(undefined)
    setBusy(true)
    reloadProxies()
    await refresh()
    setBusy(false)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('proxyBase.title', 'Account base for proxies')}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary" data-proxy-base-paid>
              {t(
                'proxyBase.paid',
                'A paid feature, one for the account: every proxy of it named under a subdomain of yours.'
              )}
            </Typography>
          </Gutters>
        </>
      }
    >
      <Gutters size={null}>
        {!admin ? (
          <Gutters>
            <Notice fullWidth>
              {t('proxyBase.adminOnly', 'Only an admin of the account can see or set its base.')}
            </Notice>
          </Gutters>
        ) : base === undefined ? (
          <LoadingMessage />
        ) : base === UNSUPPORTED || base === 'ERROR' ? (
          <Gutters>
            <Notice severity={base === 'ERROR' ? 'error' : 'info'} fullWidth>
              {base === 'ERROR'
                ? t('proxyBase.failed', 'The account’s base could not be read.')
                : t('proxyBase.unsupported', 'This server does not have account bases for proxies.')}
            </Notice>
          </Gutters>
        ) : !current && !included ? (
          <Gutters>
            <PaidOnly t={t} />
          </Gutters>
        ) : (
          <List data-proxy-base={current?.state ?? 'none'}>
            {fixed && current ? (
              <ListItemSetting
                icon="sitemap"
                label={current.base}
                subLabel={t('proxyBase.serving', 'The account’s base: to use another, remove this one first')}
              />
            ) : (
              <InlineTextFieldSetting
                icon="sitemap"
                label={t('proxyBase.label', 'Subdomain')}
                value={current?.base ?? ''}
                placeholder={t('proxyBase.placeholder', 'none: a subdomain you control, as proxies.example.com')}
                filter={/[^a-zA-Z0-9.-]/g}
                maxLength={253}
                disabled={busy}
                validate={value => (dnsNameOf(value) ? baseProblem(t, dnsNameOf(value)) : undefined)}
                onSave={value => claim(String(value))}
              />
            )}
            {current && <StateLine t={t} base={current} busy={busy} onCheck={check} />}
            {current?.removeAt && (
              <ListItem>
                <Notice severity="warning" fullWidth>
                  <span data-proxy-base-removal={current.removeReason}>
                    {current.removeReason === 'plan'
                      ? t(
                          'proxyBase.removedPlan',
                          'The account’s plan no longer includes a base: remote.it removes it — its proxies back under their own names — unless the plan includes one again by'
                        )
                      : t(
                          'proxyBase.removedPending',
                          'Not delegated yet: remote.it removes it unless its NS records are found by'
                        )}{' '}
                    <Timestamp date={new Date(current.removeAt)} variant="minutes" />
                  </span>
                </Notice>
              </ListItem>
            )}
            <ListItem>
              <ListItemIcon />
              <ListItemText
                data-proxy-base-hint
                secondary={
                  current?.state === 'active'
                    ? t(
                        'proxyBase.activeHint',
                        'Every proxy of the account is named <label>.{{base}}, but one with a name of its own; remote.it writes their records and keeps their certificates. Keep these NS records where your DNS is hosted.',
                        { base: current.base }
                      )
                    : t(
                        'proxyBase.hint',
                        'Delegate a subdomain you control to remote.it with these NS records; every proxy of the account is then named under it, its records and certificates kept by remote.it.'
                      )
                }
              />
            </ListItem>
            {!!current?.records.length && (
              <ListItem>
                <DnsRecords t={t} records={current.records} data-proxy-base-records />
              </ListItem>
            )}
            {!!current?.nameServers.length && (
              <ListItemSetting
                icon="server"
                label={t('proxyBase.nameServers', 'Its name servers')}
                subLabel={<span data-proxy-base-name-servers>{current.nameServers.join(', ')}</span>}
                secondaryContent={
                  <CopyIconButton
                    value={current.nameServers.join('\n')}
                    title={t('proxyBase.copyNameServers', 'Copy them all')}
                    size="sm"
                  />
                }
              />
            )}
            {notice && (
              <ListItem>
                <Notice severity="error" fullWidth onClose={() => setNotice(undefined)}>
                  {notice}
                </Notice>
              </ListItem>
            )}
            {current?.state === 'verified' && (
              <ListItemSetting
                icon="circle-arrow-right"
                label={t('proxyBase.move', 'Move the account’s proxies under {{base}}', { base: current.base })}
                subLabel={t('proxyBase.moveHint', 'What moves is said first, proxy by proxy')}
                button={t('ownName.moveButton', 'Move')}
                buttonDisabled={busy}
                secondaryContentWidth={BUTTON_ROOM}
                onButtonClick={() => setMoving({ mode: 'verify' })}
              />
            )}
            {current && (
              <ListItemSetting
                icon="rotate-left"
                label={t('proxyBase.remove', 'Remove the account’s base')}
                subLabel={t('proxyBase.removeHint', 'Which proxies move back is said first; then its zone is deleted')}
                button={t('ownName.removeButton', 'Remove')}
                buttonDisabled={busy}
                secondaryContentWidth={BUTTON_ROOM}
                onButtonClick={() => setMoving({ mode: 'remove' })}
              />
            )}
          </List>
        )}
      </Gutters>
      {moving && current && (
        <BaseMoveDialog
          accountId={accountId}
          base={current.base}
          {...moving}
          onClose={() => setMoving(undefined)}
          onMoved={moved}
        />
      )}
    </Container>
  )
}

// An account whose plan does not include a base: that it is a paid feature, and where plans are — nothing to fill in.
const PaidOnly: React.FC<{ t: TFunction }> = ({ t }) => {
  const history = useHistory()
  return (
    <Notice
      fullWidth
      button={
        <BillingUI>
          <Button variant="contained" size="small" onClick={() => history.push('/account/plans')}>
            {t('proxyBase.upgrade', 'Upgrade')}
          </Button>
        </BillingUI>
      }
    >
      <span data-proxy-base-plan>
        {t(
          'proxyBase.planNone',
          'The account’s plan does not include a base for its proxies’ names: it is a paid add-on, and the Enterprise plan includes it.'
        )}
      </span>
    </Notice>
  )
}

// Why a base cannot be one, as far as it can be told here: DNS labels, a subdomain — not a domain itself. The rest
// (reserved, taken, not under a domain) is graphql's to say, in its words.
export function baseProblem(t: TFunction, name: string): string | undefined {
  const shape = dnsNameShape(name)
  if (shape === 'shape') return t('ownName.problemShape', 'Letters, digits and hyphens, in parts joined by dots')
  if (shape === 'domain')
    return t('proxyBase.problemDomain', 'A subdomain of your domain, as proxies.example.com: not the domain itself')
  return undefined
}

// Where it stands, with the last check, any problem graphql says, and Check now.
const StateLine: React.FC<{ t: TFunction; base: AccountProxyBase; busy: boolean; onCheck: () => void }> = ({
  t,
  base,
  busy,
  onCheck,
}) => {
  const line = baseLine(t, base)
  return (
    <ListItemSetting
      icon={line.icon}
      iconColor={line.color}
      label={line.label}
      subLabel={
        <span data-proxy-base-state-hint>
          {[line.hint, base.problem]
            .filter(Boolean)
            .map(part => `${part} · `)
            .join('')}
          {base.checked ? (
            <>
              {t('ownName.checked', 'Checked')} <Timestamp date={new Date(base.checked)} />
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

/* The account's proxies moved under its base, or back to their names before: proxy by proxy, its name after and every
   endpoint address before and after, and the certificate after, said first — from a check's answer where there is
   one, else asked — then moved once confirmed; removed, the base's zone is deleted too. A refusal is said in graphql's
   words, and nothing moves. */
const BaseMoveDialog: React.FC<
  Moving & { accountId: string; base: string; onClose: () => void; onMoved: () => void }
> = ({ accountId, base, mode, said: given, onClose, onMoved }) => {
  const { t } = useTranslation()
  const [said, setSaid] = useState<BaseMove | { reason: string } | undefined>(given)
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const ask = (apply: boolean) =>
    mode === 'verify'
      ? graphQLVerifyAccountProxyBase(accountId, apply)
      : graphQLRemoveAccountProxyBase(accountId, apply)

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
          ? t('proxyBase.moveTitle', 'Move the account’s proxies under {{base}}?', { base })
          : t('proxyBase.removeTitle', 'Remove {{base}}?', { base })
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
          {!!said.moves.length && (
            <Typography variant="body2" gutterBottom data-proxy-base-certificate>
              {baseMoveCertificateLine(t, mode, said.moves[0].certificate, base)}
            </Typography>
          )}
          {said.moves.length ? (
            said.moves.map(each => (
              // Its name after as a line of its own: a list subheader's capitals would change how a DNS name reads.
              <Box key={each.proxy.id} data-proxy-base-move={each.proxy.id} marginTop={1}>
                <Typography variant="body2" fontWeight={500} data-proxy-base-move-name>
                  {t('proxyBase.moveProxy', '{{proxy}}: {{name}}', {
                    proxy: each.proxy.name,
                    name: each.ownName ?? each.host,
                  })}
                </Typography>
                <List dense disablePadding>
                  {each.addresses.length ? (
                    each.addresses.map(address => (
                      <ListItem key={address.endpoint} disableGutters>
                        <ListItemText
                          primary={address.to}
                          secondary={t('proxyPage.moveFrom', 'was {{from}}', address)}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem disableGutters>
                      <ListItemText secondary={t('proxyPage.namesNoAddresses', 'No endpoint address moves.')} />
                    </ListItem>
                  )}
                </List>
              </Box>
            ))
          ) : (
            <Typography variant="body2" gutterBottom data-proxy-base-none>
              {t('proxyBase.noProxies', 'No proxy moves.')}
            </Typography>
          )}
          {mode === 'remove' && (
            <Typography variant="body2" data-proxy-base-zone>
              {t(
                'proxyBase.removeZone',
                'remote.it’s zone for {{base}} is deleted: its NS records can then come out of your DNS.',
                { base }
              )}
            </Typography>
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
