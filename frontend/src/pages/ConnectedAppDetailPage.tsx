import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { Box, Button, Chip, List, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../store'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { FormDisplay } from '../components/FormDisplay'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'
import { Timestamp } from '../components/Timestamp'
import { AgentAvatar } from '../components/ConnectedApps/AgentAvatar'
import { enabledActions, revokeWindow } from '../components/ConnectedApps/helpers'
import { oidcStart } from '../services/oidc'
import { updateAccountApp } from '../services/permitteerAccount'
import { spacing } from '../styling'

export const ConnectedAppDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { clientId } = useParams<{ clientId: string }>()
  const decoded = decodeURIComponent(clientId)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const agent = useSelector((state: State) => state.agents.agents.find(a => a.clientId === decoded))
  const fetching = useSelector((state: State) => state.agents.fetching)
  const init = useSelector((state: State) => state.agents.init)
  const revoking = useSelector((state: State) => state.agents.updating === agent?.id)

  // Editor state: null = pristine (mirror the server); a Set = the user's pending choice.
  // The PATCH is the console editor's own: unlisted ceiling actions disable but stay
  // listed, so anything unticked here can be re-ticked later.
  const [keepEdit, setKeepEdit] = useState<Set<string> | null>(null)
  const [scopeEdit, setScopeEdit] = useState<Set<string> | null>(null)
  const [reachEdit, setReachEdit] = useState<{ all: boolean; ids: Set<string> } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dispatch.agents.init()
  }, [])

  const back = () => history.push('/account/connected')

  if (!agent) {
    return (
      <Container
        gutterBottom
        header={
          <Typography variant="h1">
            <Title>{t('connectedAppDetailPage.title', 'Connected App')}</Title>
          </Typography>
        }
      >
        <Gutters>
          {fetching || !init ? (
            <Typography variant="body2" color="textSecondary">
              <Icon name="spinner-third" spin inlineLeft /> {t('common.loadingEllipsis', 'Loading…')}
            </Typography>
          ) : (
            <Notice severity="info" fullWidth>
              {t('connectedAppDetailPage.noLongerAuthorized', 'This app is no longer authorized.')}
            </Notice>
          )}
        </Gutters>
      </Container>
    )
  }

  const name = agent.app || agent.clientId
  const actions = enabledActions(agent)
  const reach = agent.revokeReach
  const allActions = (agent.groups ?? []).flatMap(g => g.actions)
  const kept = keepEdit ?? new Set(allActions.filter(a => a.enabled).map(a => a.key))
  const scopesKept = scopeEdit ?? new Set(agent.scopes ?? [])
  // The grant's reach (one scope constraint per grant; every scoped group carries the same)
  const reachGroup = (agent.groups ?? []).find(gr => gr.reach)?.reach ?? null
  const reachNow = reachEdit ?? (reachGroup ? { all: reachGroup.all, ids: new Set(reachGroup.accounts.map(a => a.id)) } : null)
  const reachDirty =
    reachEdit !== null && reachGroup !== null &&
    (reachEdit.all !== reachGroup.all ||
      reachEdit.ids.size !== reachGroup.accounts.length ||
      reachGroup.accounts.some(a => !reachEdit.ids.has(a.id)))
  const dirty =
    (keepEdit !== null && (keepEdit.size !== actions.length || actions.some(a => !keepEdit.has(a.key)))) ||
    (scopeEdit !== null && (scopeEdit.size !== (agent.scopes ?? []).length || (agent.scopes ?? []).some(sc => !scopeEdit.has(sc)))) ||
    reachDirty
  const toggleAction = (key: string) => {
    if (!agent.active || saving) return
    const next = new Set(kept)
    next.has(key) ? next.delete(key) : next.add(key)
    setKeepEdit(next)
  }
  const toggleScope = (sc: string) => {
    if (!agent.active || saving) return
    const next = new Set(scopesKept)
    next.has(sc) ? next.delete(sc) : next.add(sc)
    setScopeEdit(next)
  }
  const toggleReachAll = () => {
    if (!agent.active || saving || !reachNow || !reachGroup?.ceilingAll) return
    if (reachNow.all) {
      // Leaving all-mode keeps today's accounts selected — deselecting "all, including
      // ones added later" narrows from full coverage, it doesn't strip everything.
      const known = new Set([
        ...(reachGroup.options ?? []).map(o => o.id),
        ...reachGroup.accounts.map(a => a.id),
        ...reachNow.ids,
      ])
      setReachEdit({ all: false, ids: known })
    } else {
      setReachEdit({ all: true, ids: new Set(reachNow.ids) })
    }
  }
  const toggleReachId = (id: string) => {
    if (!agent.active || saving || !reachNow || reachNow.all) return
    // An account outside this consent is selectable now: the app asked for account-scoped
    // access and never named accounts, so choosing a different subset of your OWN accounts
    // adds no capability it did not request. The server bounds it by what you may actually
    // delegate today and asks for a recent sign-in before it lands.
    const ids = new Set(reachNow.ids)
    ids.has(id) ? ids.delete(id) : ids.add(id)
    setReachEdit({ all: false, ids })
  }
  // What this save would ADD beyond what was consented — an offered permission being taken
  // up, or an account this grant never reached. Everything else on this page removes access;
  // these are the only choices that create it, so they are named before they are made.
  const adding = [
    ...allActions.filter(a => a.offered && kept.has(a.key)).map(a => a.label),
    ...(reachGroup && reachNow && !reachNow.all
      ? [...reachNow.ids]
          .filter(id => !reachGroup.ceilingAll && !reachGroup.ceilingIds.includes(id))
          .map(id => (reachGroup.options ?? []).find(o => o.id === id)?.label ?? id)
      : []),
  ]

  const save = async () => {
    if (adding.length) {
      const ok = window.confirm(
        t('connectedAppDetailPage.confirmExtend', {
          name,
          list: adding.join(', '),
          defaultValue:
            'Give {{name}} access it does not have yet?\n\nAdding: {{list}}\n\nYou may be asked to sign in again to confirm it is you.',
        })
      )
      if (!ok) return
    }
    setSaving(true)
    const r = await updateAccountApp(
      agent.id,
      [...kept],
      [...scopesKept],
      reachDirty && reachNow ? (reachNow.all ? { all: true } : { accounts: [...reachNow.ids] }) : undefined
    )
    // The step-up: the session is live but not RECENT, and giving an app more than was
    // approved needs proof it is you. Send them back through the login page with the choice
    // still pending, rather than reporting a failure they cannot act on.
    if (r.status === 403 && (r.body as any)?.error === 'reauthentication_required') {
      setSaving(false)
      await oidcStart({ prompt: 'login' })
      return
    }
    if (r.status >= 400) {
      setSaving(false)
      setError((r.body as any)?.error_description || t('connectedAppDetailPage.saveFailed', 'That change could not be saved.'))
      return
    }
    setError(null)
    await dispatch.agents.fetch()
    setKeepEdit(null)
    setScopeEdit(null)
    setReachEdit(null)
    setSaving(false)
  }

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>
            <AgentAvatar agent={agent} size={spacing.xl} inline />
            {name}
            {agent.appOrigin ? (
              <Typography component="span" variant="body2" color="textSecondary" sx={{ marginLeft: 1.5 }}>
                {agent.appOrigin}
              </Typography>
            ) : null}
            {!agent.active ? (
              <Chip size="small" label={t('connectedAppDetailPage.revoked', 'revoked')} sx={{ marginLeft: 1.5, verticalAlign: 'middle' }} />
            ) : null}
          </Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">{t('connectedAppDetailPage.permissions', 'Permissions')}</Typography>
      <Gutters top={null}>
        {allActions.length ? (
          <>
            <Typography variant="caption" display="block" sx={{ marginBottom: 1.5 }}>
              {agent.active
                ? t('connectedAppDetailPage.editHint', {
                    name,
                    defaultValue: 'Granted when {{name}} signed in. Tap a permission to disable it — it stays listed so you can re-enable it later.',
                  })
                : t('connectedAppDetailPage.revokedHint', {
                    name,
                    defaultValue: 'This access was revoked — shown for the record. {{name}} can request access again by signing in.',
                  })}
            </Typography>
            {(agent.groups ?? []).map((group, i) => {
              if (!group.actions.length) return null
              const where =
                group.resourceLabel && group.resourceLabel !== '(all resources)' ? ` — ${group.resourceLabel}` : ''
              // Consent's grammar: one row per <piece>, verbs as toggle chips; a limit
              // every action shares reads once under the group instead of on every chip.
              const limits = [...new Set(group.actions.map(a => a.limit).filter(Boolean))]
              const sharedLimit = limits.length === 1 && group.actions.every(a => a.limit === limits[0]) ? limits[0] : null
              const pieces = [...new Set(group.actions.map(a => a.piece ?? null))]
              const chips = (actions: IGrantAction[]) =>
                actions.map(action => {
                  const on = kept.has(action.key)
                  // Three states: granted-and-on, granted-but-off, and ASKED FOR but never
                  // granted. The third is selectable because the app did request it and you
                  // did see it at consent — turning it on adds nothing it never asked for.
                  const offered = !!action.offered
                  const base = !sharedLimit && action.limit ? `${action.label} (${action.limit})` : action.label
                  return (
                    <Chip
                      key={action.key}
                      size="small"
                      clickable={agent.active}
                      color={on && agent.active ? 'primary' : undefined}
                      variant={on ? 'filled' : 'outlined'}
                      onClick={() => toggleAction(action.key)}
                      label={offered ? t('connectedAppDetailPage.notGranted', { label: base, defaultValue: '{{label}} — not granted' }) : base}
                      title={
                        offered
                          ? t('connectedAppDetailPage.notGrantedHint', 'This app asked for this and you did not grant it. You can turn it on here.')
                          : action.description || undefined
                      }
                      sx={{ mr: 1, mb: 0.5, opacity: on ? 1 : 0.6, ...(offered ? { borderStyle: 'dashed' } : {}) }}
                    />
                  )
                })
              return (
                <React.Fragment key={i}>
                  <Typography variant="overline" display="block" sx={{ marginTop: i ? 1.5 : 0 }}>
                    {group.typeLabel}
                    {where}
                    {group.apiHost ? (
                      <Typography component="span" variant="caption" color="textSecondary" sx={{ textTransform: 'none', marginLeft: 1 }}>
                        {group.apiHost}
                      </Typography>
                    ) : null}
                  </Typography>
                  {pieces.length > 1 ? (
                    pieces.map(piece => (
                      <Box key={piece ?? 'general'} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, marginBottom: 0.5 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ flex: '0 0 90px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          {piece ?? 'General'}
                        </Typography>
                        <Box>{chips(group.actions.filter(a => (a.piece ?? null) === piece))}</Box>
                      </Box>
                    ))
                  ) : (
                    chips(group.actions)
                  )}
                  {group.reach && reachNow ? (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, marginBottom: 0.5 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ flex: '0 0 90px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {t('connectedAppDetailPage.accounts', 'Accounts')}
                      </Typography>
                      <Box>
                        {group.reach.ceilingAll ? (
                          <Chip
                            size="small"
                            clickable={agent.active}
                            color={reachNow.all && agent.active ? 'primary' : undefined}
                            variant={reachNow.all ? 'filled' : 'outlined'}
                            onClick={toggleReachAll}
                            label={t('connectedAppDetailPage.allAccounts', 'All accounts, including ones added later')}
                            sx={{ mr: 1, mb: 0.5, opacity: reachNow.all ? 1 : 0.6 }}
                          />
                        ) : null}
                        {[...new Set([
                          ...(group.reach.options ?? []).map(o => o.id),
                          ...group.reach.accounts.map(a => a.id),
                          ...(!group.reach.ceilingAll ? group.reach.ceilingIds : []),
                        ])].map(id => {
                          const label = (group.reach!.options ?? []).find(o => o.id === id)?.label ?? id
                          const on = reachNow.all || reachNow.ids.has(id)
                          const editable = agent.active && !reachNow.all
                          // Outside what was consented: still offerable, but say so — turning
                          // it on shares that account with this app for the first time.
                          const adding = !group.reach!.ceilingAll && !group.reach!.ceilingIds.includes(id)
                          return (
                            <Chip
                              key={id}
                              size="small"
                              clickable={editable}
                              color={on && agent.active && !reachNow.all ? 'primary' : undefined}
                              variant={on ? 'filled' : 'outlined'}
                              onClick={() => toggleReachId(id)}
                              label={adding ? t('connectedAppDetailPage.addAccount', { label, defaultValue: '{{label}} — add' }) : label}
                              sx={{ mr: 1, mb: 0.5, opacity: on ? (reachNow.all ? 0.7 : 1) : 0.6, ...(adding ? { borderStyle: 'dashed' } : {}) }}
                            />
                          )
                        })}
                      </Box>
                    </Box>
                  ) : null}
                  {sharedLimit ? (
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ marginBottom: 0.5 }}>
                      {sharedLimit}
                    </Typography>
                  ) : null}
                </React.Fragment>
              )
            })}
            {(agent.scopes ?? []).length ? (
              <>
                <Typography variant="overline" display="block" sx={{ marginTop: 1.5 }}>
                  {t('connectedAppDetailPage.signInScopes', 'Sign-in scopes')}
                </Typography>
                {(agent.scopes ?? []).map(sc => {
                  const on = scopesKept.has(sc)
                  return (
                    <Chip
                      key={sc}
                      size="small"
                      clickable={agent.active}
                      color={on && agent.active ? 'primary' : undefined}
                      variant={on ? 'filled' : 'outlined'}
                      onClick={() => toggleScope(sc)}
                      label={sc}
                      sx={{ mr: 1, mb: 0.5, opacity: on ? 1 : 0.6 }}
                    />
                  )
                })}
              </>
            ) : null}
            {error ? (
              <Notice severity="error" fullWidth gutterTop>
                {error}
              </Notice>
            ) : null}
            {dirty ? (
              <Box sx={{ marginTop: 1.5 }}>
                {adding.length ? (
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ marginBottom: 0.75 }}>
                    {t('connectedAppDetailPage.willAdd', {
                      list: adding.join(', '),
                      defaultValue: 'This gives the app access it does not have yet: {{list}}',
                    })}
                  </Typography>
                ) : null}
                <Button variant="contained" size="small" disabled={saving} onClick={save}>
                  {saving ? t('common.saving', 'Saving…') : t('connectedAppDetailPage.save', 'Save changes')}
                </Button>
                <Button
                  size="small"
                  sx={{ marginLeft: 1 }}
                  disabled={saving}
                  onClick={() => { setKeepEdit(null); setScopeEdit(null); setReachEdit(null); setError(null) }}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </Box>
            ) : null}
          </>
        ) : null}
        {(agent.scopeGroups ?? []).map((group, i) => (
          <React.Fragment key={group.api}>
            <Typography variant="overline" display="block" sx={{ marginTop: actions.length || i ? 1.5 : 0 }}>
              {group.api}
            </Typography>
            {group.actions.map(action => (
              <Chip
                key={action.key}
                size="small"
                label={action.label}
                title={action.description || undefined}
                sx={{ mr: 1, mb: 0.5 }}
              />
            ))}
          </React.Fragment>
        ))}
        {!allActions.length && !(agent.scopeGroups ?? []).length && (
          <Typography variant="body2" color="textSecondary">
            {t(
              'connectedAppDetailPage.signInOnly',
              'Sign-in only — it can confirm your identity, but was granted nothing else.'
            )}
          </Typography>
        )}
      </Gutters>

      <Typography variant="subtitle1">{t('connectedAppDetailPage.details', 'Details')}</Typography>
      <List>
        {agent.givenAt && (
          <FormDisplay
            icon="calendar-star"
            label={t('connectedAppDetailPage.authorized', 'Authorized')}
            displayValue={<Timestamp date={new Date(agent.givenAt)} variant="long" />}
            displayOnly
          />
        )}
        <FormDisplay
          icon="clock"
          label={t('connectedAppDetailPage.lastUsed', 'Last used')}
          displayValue={
            agent.lastUsedAt ? (
              <Timestamp date={new Date(agent.lastUsedAt)} variant="long" />
            ) : (
              t('connectedAppDetailPage.noActivityYet', 'No activity yet')
            )
          }
          displayOnly
        />
        {agent.links?.map(link => (
          <FormDisplay
            key={link.url}
            icon="arrow-up-right-from-square"
            label={link.name}
            displayValue={
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.url}
              </a>
            }
            displayOnly
          />
        ))}
      </List>

      {agent.active ? (
      <>
      <Typography variant="subtitle1">{t('connectedAppDetailPage.revokeSection', 'Revoke access')}</Typography>
      <Gutters top={null}>
        <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 1.5 }}>
          {t('connectedAppDetailPage.revokeExplain', {
            name,
            defaultValue: 'Signs {{name}} out of your account and blocks it from getting new access. It can request access again by signing in.',
          })}
        </Typography>
        <ConfirmButton
          confirm
          title={t('connectedAppDetailPage.revokeAccess', 'Revoke access')}
          color="danger"
          size="small"
          loading={revoking}
          disabled={revoking}
          confirmProps={{
            title: t('connectedAppDetailPage.revokeAccessConfirmTitle', 'Revoke access?'),
            action: t('connectedAppDetailPage.revoke', 'Revoke'),
            color: 'error',
            children: (
              <>
                <Notice severity="error" gutterBottom fullWidth>
                  <b>{name}</b>{' '}
                  {t('connectedAppDetailPage.signOutBefore', 'will be signed out and can no longer get new access.')}
                  {reach?.delayed?.length ? (
                    <>
                      {' '}
                      {t('connectedAppDetailPage.delayedReach', {
                        apis: reach.delayed.join(', '),
                        window: revokeWindow(reach.delayMinutes),
                        defaultValue: 'Access already in progress at {{apis}} ends within {{window}}.',
                      })}
                    </>
                  ) : null}
                </Notice>
                <Typography variant="body2">
                  {t('connectedAppDetailPage.requestAgain', 'It can request access again by signing in.')}
                </Typography>
              </>
            ),
          }}
          onClick={async () => {
            await dispatch.agents.revoke(agent.id)
            back()
          }}
        />
      </Gutters>
      </>
      ) : null}
    </Container>
  )
}
