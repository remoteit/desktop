import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Button, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Confirm } from '../components/Confirm'
import {
  AppPublisher,
  AppPublishing,
  graphQLAddAppPublisherKey,
  graphQLAppPublisher,
  graphQLClaimAppPublisher,
  graphQLRemoveAppPublisherDomain,
  graphQLRenameAppPublisher,
  graphQLRequestAppPublisherDomain,
  graphQLRevokeAppPublisherKey,
  graphQLVerifyAppPublisherDomain,
  PublisherChange,
  releasesSignedBy,
} from '../services/graphQLAppPublishers'

/* The account's app publisher (presence-server docs/device-apps-design.md, build step 7): claim a publisher id — the
   first part of every app id it publishes, first come, first served, remote.it's and well-known names reserved, and for
   good —; its name, shown with its apps; its signing keys (the public half pasted here, the private half never leaving
   the publisher's machine; several at once for rotation; revoking one withdraws every release it signed); and its
   private apps with their releases, which reach the account's own devices only. Releases are published with the
   publishing tool (appReleaseUploads, then setAppRelease); they are listed here. The account admin's. */
export const PublisherPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  const [read, setRead] = useState<{ publisher: AppPublisher | null; publishing: AppPublishing } | null>()
  const [refusal, setRefusal] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [claimId, setClaimId] = useState('')
  const [claimName, setClaimName] = useState('')
  const [rename, setRename] = useState<string>()
  const [newKey, setNewKey] = useState('')
  const [revoking, setRevoking] = useState<string>()
  const [newDomain, setNewDomain] = useState('')

  useEffect(() => {
    let current = true
    setRead(undefined)
    graphQLAppPublisher(account).then(answer => current && setRead(answer ?? null))
    return () => {
      current = false
    }
  }, [account])

  const apply = async (work: () => Promise<PublisherChange>) => {
    setBusy(true)
    setRefusal(undefined)
    const result = await work()
    setBusy(false)
    if ('reason' in result) {
      setRefusal(result.reason || t('publisherPage.failed', 'That did not go through'))
      return false
    }
    setRead(read => read && { ...read, publisher: result.publisher })
    return true
  }

  const publisher = read?.publisher
  const signed = publisher && revoking ? releasesSignedBy(publisher, revoking) : []

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('publisherPage.title', 'App publisher')}</Title>
        </Typography>
      }
    >
      {read === null && (
        <Notice severity="info" gutterTop>
          {t('publisherPage.unavailable', 'Publishing apps is not available here.')}
        </Notice>
      )}
      {refusal && (
        <Notice severity="error" gutterTop onClose={() => setRefusal(undefined)}>
          {refusal}
        </Notice>
      )}
      {read && !publisher && (
        <Gutters data-publisher-claim>
          <Typography variant="body2" gutterBottom>
            {t(
              'publisherPage.claimIntro',
              'Publish your own apps for your own devices. Choose a publisher id: every app you publish is named <id>.<app>. Ids are first come, first served; remote.it’s and well-known names are reserved, and an id is yours for good.'
            )}
          </Typography>
          <TextField
            fullWidth
            size="small"
            variant="filled"
            label={t('publisherPage.id', 'Publisher id')}
            helperText={t('publisherPage.idHelp', '1 to 32 of a–z, 0–9 and -')}
            value={claimId}
            onChange={e => setClaimId(e.target.value.toLowerCase())}
            inputProps={{ maxLength: 32, 'data-claim-id': true }}
            sx={{ marginBottom: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            variant="filled"
            label={t('publisherPage.name', 'Name shown with your apps')}
            value={claimName}
            onChange={e => setClaimName(e.target.value)}
            inputProps={{ maxLength: 64, 'data-claim-name': true }}
            sx={{ marginBottom: 1 }}
          />
          <Button
            variant="contained"
            disabled={busy || !/^[a-z0-9-]{1,32}$/.test(claimId) || !claimName.trim()}
            onClick={() => apply(() => graphQLClaimAppPublisher(claimId, claimName, account))}
            data-claim
          >
            {t('publisherPage.claim', 'Claim')}
          </Button>
        </Gutters>
      )}
      {publisher && (
        <>
          <Gutters data-publisher={publisher.id}>
            <Typography variant="h2">{publisher.name}</Typography>
            <Typography variant="caption" color="textSecondary" component="div">
              {t('publisherPage.ids', 'Your apps are {{id}}.<app>', { id: publisher.id })}
            </Typography>
            {publisher.verifiedDomain && (
              <Typography variant="caption" color="primary" component="div" data-publisher-verified>
                {t('publisherPage.verified', 'Verified: {{domain}}', { domain: publisher.verifiedDomain })}
              </Typography>
            )}
            {rename === undefined ? (
              <Button size="small" onClick={() => setRename(publisher.name)} data-rename>
                {t('publisherPage.rename', 'Rename')}
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
                <TextField
                  size="small"
                  variant="filled"
                  value={rename}
                  onChange={e => setRename(e.target.value)}
                  inputProps={{ maxLength: 64, 'data-rename-name': true }}
                />
                <Button
                  disabled={busy || !rename.trim()}
                  onClick={async () => (await apply(() => graphQLRenameAppPublisher(rename, account))) && setRename(undefined)}
                  data-rename-save
                >
                  {t('publisherPage.save', 'Save')}
                </Button>
              </Box>
            )}
          </Gutters>

          <Typography variant="subtitle1">{t('publisherPage.keys', 'Signing keys')}</Typography>
          {!read?.publishing.certifies && (
            <Notice severity="warning" gutterBottom>
              {t('publisherPage.noCatalogueKey', 'This stage cannot certify keys yet, so its devices take no published app.')}
            </Notice>
          )}
          <List dense data-publisher-keys>
            {publisher.keys.map(key => (
              <ListItem
                key={key.keyId}
                data-key={key.keyId}
                secondaryAction={
                  !key.revoked && (
                    <Button size="small" color="error" disabled={busy} onClick={() => setRevoking(key.keyId)} data-revoke={key.keyId}>
                      {t('publisherPage.revoke', 'Revoke')}
                    </Button>
                  )
                }
              >
                <ListItemText
                  primary={key.keyId}
                  secondary={
                    key.revoked
                      ? t('publisherPage.revoked', 'Revoked {{when}}', { when: day(key.revoked) })
                      : t('publisherPage.keyLine', 'Added {{added}} · certified until {{until}}', {
                          added: day(key.added),
                          until: key.notAfter ? day(key.notAfter) : '—',
                        })
                  }
                />
              </ListItem>
            ))}
          </List>
          <Gutters>
            <TextField
              fullWidth
              size="small"
              variant="filled"
              label={t('publisherPage.addKey', 'Add a key: its Ed25519 public half, base64')}
              helperText={t(
                'publisherPage.addKeyHelp',
                'Keep the private half on your machine. To rotate, add the new key, sign new releases with it, then revoke the old one.'
              )}
              value={newKey}
              onChange={e => setNewKey(e.target.value.trim())}
              inputProps={{ 'data-new-key': true }}
            />
            <Button
              disabled={busy || !newKey}
              onClick={async () => (await apply(() => graphQLAddAppPublisherKey(newKey, account))) && setNewKey('')}
              data-add-key
            >
              {t('publisherPage.add', 'Add key')}
            </Button>
          </Gutters>

          <Typography variant="subtitle1">{t('publisherPage.domains', 'Verified domain')}</Typography>
          <Gutters>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {t(
                'publisherPage.domainsIntro',
                'Optional: prove you control a domain, and your apps show “Verified: example.com” beside your name. It says who controls the domain, nothing about your apps, and it is checked daily: without the record for three days it lapses.'
              )}
            </Typography>
          </Gutters>
          <List dense data-publisher-domains>
            {(publisher.domains ?? []).map(domain => (
              <ListItem
                key={domain.domain}
                data-domain={domain.domain}
                sx={{ display: 'block' }}
                secondaryAction={
                  <>
                    {(!domain.verified || domain.lapsed) && (
                      <Button
                        size="small"
                        disabled={busy}
                        onClick={() => apply(() => graphQLVerifyAppPublisherDomain(domain.domain, account))}
                        data-verify={domain.domain}
                      >
                        {t('publisherPage.verify', 'Verify')}
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      disabled={busy}
                      onClick={() => apply(() => graphQLRemoveAppPublisherDomain(domain.domain, account))}
                      data-remove-domain={domain.domain}
                    >
                      {t('publisherPage.removeDomain', 'Remove')}
                    </Button>
                  </>
                }
              >
                <ListItemText
                  primary={domain.domain}
                  secondary={
                    domain.lapsed
                      ? t('publisherPage.domainLapsed', 'Lapsed {{when}}: the record was gone for three days. Add it again and verify.', {
                          when: day(domain.lapsed),
                        })
                      : domain.verified
                      ? t('publisherPage.domainVerified', 'Verified {{when}} · checked daily', { when: day(domain.verified) })
                      : t('publisherPage.domainPending', 'Not verified yet: add this TXT record, then Verify')
                  }
                />
                {(!domain.verified || domain.lapsed) && (
                  <Box component="code" sx={{ display: 'block', fontSize: 12, wordBreak: 'break-all' }} data-domain-record={domain.domain}>
                    {domain.record} TXT "{domain.value}"
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
          <Gutters>
            <TextField
              size="small"
              variant="filled"
              label={t('publisherPage.addDomain', 'Domain')}
              value={newDomain}
              onChange={e => setNewDomain(e.target.value.trim().toLowerCase())}
              inputProps={{ 'data-new-domain': true }}
            />
            <Button
              disabled={busy || !newDomain.includes('.')}
              onClick={async () => (await apply(() => graphQLRequestAppPublisherDomain(newDomain, account))) && setNewDomain('')}
              data-add-domain
            >
              {t('publisherPage.addDomainAction', 'Add domain')}
            </Button>
          </Gutters>

          <Typography variant="subtitle1">{t('publisherPage.apps', 'Apps')}</Typography>
          {!publisher.apps.length && (
            <Gutters>
              <Typography variant="body2" color="textSecondary">
                {t(
                  'publisherPage.noApps',
                  'No apps yet. Publish one with the publishing tool: its files are hosted by remote.it, and it reaches this account’s own devices.'
                )}
              </Typography>
            </Gutters>
          )}
          <List dense data-publisher-apps>
            {publisher.apps.map(app => (
              <ListItem key={app.id} data-publisher-app={app.id} sx={{ display: 'block' }}>
                <ListItemText
                  primary={`${app.name} (${app.id})`}
                  secondary={
                    [app.description, t('publisherPage.private', 'Private: this account’s devices'), channelLine(app.channels)]
                      .filter(Boolean)
                      .join(' · ')
                  }
                />
                {app.releases.map(release => (
                  <Typography
                    key={release.version}
                    variant="caption"
                    component="div"
                    color={release.withdrawn ? 'error' : 'textSecondary'}
                    data-release={release.version}
                  >
                    {[
                      release.version,
                      release.root ? t('publisherPage.root', 'runs as root') : t('publisherPage.restricted', 'restricted'),
                      release.keyId && t('publisherPage.signedBy', 'signed by {{key}}', { key: release.keyId }),
                      release.withdrawn && t('publisherPage.withdrawn', 'withdrawn'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                ))}
              </ListItem>
            ))}
          </List>
          <Confirm
            open={!!revoking}
            color="error"
            title={t('publisherPage.revokeTitle', 'Revoke key {{key}}?', { key: revoking })}
            action={t('publisherPage.revoke', 'Revoke')}
            onConfirm={async () => {
              const keyId = revoking!
              setRevoking(undefined)
              await apply(() => graphQLRevokeAppPublisherKey(keyId, account))
            }}
            onDeny={() => setRevoking(undefined)}
          >
            <Typography variant="body2" data-revoke-withdraws>
              {signed.length
                ? t(
                    'publisherPage.revokeWithdraws',
                    'It is never taken again, and the {{count}} release(s) it signed are withdrawn: devices on them move to another release, or turn the app off where there is none.',
                    { count: signed.length }
                  )
                : t('publisherPage.revokeNone', 'It is never taken again. It signed no release that stands.')}
            </Typography>
          </Confirm>
        </>
      )}
    </Container>
  )
}

const day = (at: string) => {
  const date = new Date(at)
  return isNaN(date.getTime()) ? at : date.toLocaleDateString()
}

const channelLine = (channels: { stage: string; channel: string; current: string | null }[]) =>
  channels
    .filter(channel => channel.current)
    .map(channel => `${channel.stage} ${channel.channel} ${channel.current}`)
    .join(', ')
