import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { LoadingMessage } from '../components/LoadingMessage'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { NewAppForm } from '../components/NewAppForm'
import { AppPublisher, AppPublishing, graphQLAppPublisher } from '../services/graphQLAppPublishers'
import {
  AppForm,
  duplicateMembers,
  formProblems,
  manifestOf,
  manifestProblems,
  manifestText,
  newAppForm,
} from '../helpers/appManifest'

/* New app (/apps/new; presence-server docs/device-apps-new-app.md): a publisher's brand-new app, described with a
   guided form — or, with Edit as JSON, any contract-1 manifest — and checked as it changes with the very schema and
   rules graphql takes a release by and devices hold it to (helpers/appManifest, vendored from remoteit/apps). Nothing
   is sent to remote.it until it is published. Needs the account's publisher (the Publisher page claims one) and a
   standing key to sign with (Create key there). The account admin's, as the Publisher page is. */
export const NewAppPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  const [read, setRead] = useState<{ publisher: AppPublisher | null; publishing: AppPublishing } | null>()
  const [form, setForm] = useState<AppForm>(newAppForm)
  // Edit as JSON: the manifest's text, the source while it is set.
  const [json, setJson] = useState<string>()

  useEffect(() => {
    let current = true
    setRead(undefined)
    graphQLAppPublisher(account).then(answer => current && setRead(answer ?? null))
    return () => {
      current = false
    }
  }, [account])

  const publisher = read?.publisher
  const standing = publisher?.keys.filter(key => !key.revoked) ?? []

  // The manifest the page holds now, and everything wrong with it: first what would be lost on the way to it (a name
  // given twice, an environment line with no NAME=), then the contract's own problems.
  const { manifest, problems } = useMemo(() => {
    if (!publisher) return { manifest: undefined, problems: [] }
    if (json !== undefined) {
      let parsed: unknown
      try {
        parsed = JSON.parse(json)
      } catch (error) {
        return {
          manifest: undefined,
          problems: [t('newApp.notJson', 'Not JSON: {{error}}', { error: (error as Error).message })],
        }
      }
      const twice = duplicateMembers(json).map(path =>
        t('newApp.memberTwice', '{{path}} is named twice: a manifest names each once', { path })
      )
      return { manifest: parsed as Record<string, any>, problems: twice.length ? twice : manifestProblems(parsed) }
    }
    const lost = formProblems(form).map(({ code, value }) =>
      code === 'settingTwice'
        ? t('newApp.settingTwice', 'Two settings are named {{value}}: name each once', { value })
        : code === 'envTwice'
        ? t('newApp.envTwice', 'The environment names {{value}} twice', { value })
        : t('newApp.envNoEquals', 'The environment line “{{value}}” is not NAME=value', { value })
    )
    const m = manifestOf(form, publisher.id)
    return { manifest: m, problems: lost.length ? lost : manifestProblems(m) }
  }, [form, json, publisher, t])

  const id = typeof manifest?.app === 'string' ? manifest.app : ''
  const others = publisher && id && !id.startsWith(`${publisher.id}.`)
  // A new app's id is one its publisher has not published: a new release of one is the publishing tool's.
  const taken = publisher?.apps.some(app => app.id === id) ? id : undefined

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('newApp.title', 'New app')}</Title>
        </Typography>
      }
    >
      {read === undefined ? (
        <LoadingMessage />
      ) : read === null ? (
        <Notice severity="info" gutterTop>
          {t('publisherPage.unavailable', 'Publishing apps is not available here.')}
        </Notice>
      ) : !publisher ? (
        <Notice
          severity="info"
          gutterTop
          button={<Link to="/account/publisher">{t('newApp.claimLink', 'Publisher page')}</Link>}
        >
          <span data-new-app-claim>
            {t('newApp.claimFirst', 'Claim a publisher id first: your apps are named after it.')}
          </span>
        </Notice>
      ) : (
        <>
          <Gutters>
            <Typography variant="body2" color="textSecondary">
              {t(
                'newApp.intro',
                'Describe your app, add its files, then sign and publish its first release. It is private: it reaches this account’s devices only. You sign it here with your key file, which never leaves your browser.'
              )}{' '}
              <Link to="/apps/build">{t('newApp.buildLink', 'Or build it yourself with the publishing tool.')}</Link>
            </Typography>
          </Gutters>
          {!standing.length && (
            <Notice
              severity="warning"
              gutterBottom
              button={<Link to="/account/publisher">{t('newApp.keyLink', 'Create key')}</Link>}
            >
              <span data-new-app-no-key>
                {t('newApp.noKey', 'Your publisher has no signing key yet: create one before you publish.')}
              </span>
            </Notice>
          )}
          <Gutters bottom={null}>
            <FormControlLabel
              control={
                <Switch
                  checked={json !== undefined}
                  onChange={e => setJson(e.target.checked ? manifestText(manifestOf(form, publisher.id)) : undefined)}
                  data-edit-json
                />
              }
              label={t('newApp.editJson', 'Edit as JSON (any contract-1 manifest: named listeners, several services)')}
            />
            {json !== undefined && (
              <Typography variant="caption" color="textSecondary" component="p">
                {t(
                  'newApp.jsonNote',
                  'Turning this off goes back to the form as it was: changes made here are not carried over.'
                )}
              </Typography>
            )}
          </Gutters>
          {json === undefined ? (
            <NewAppForm form={form} publisher={publisher.id} onChange={setForm} />
          ) : (
            <Gutters>
              <TextField
                fullWidth
                multiline
                minRows={16}
                variant="filled"
                value={json}
                onChange={e => setJson(e.target.value)}
                inputProps={{
                  'data-manifest-json': true,
                  spellCheck: false,
                  style: { fontFamily: 'Roboto Mono, monospace', fontSize: 12 },
                }}
              />
            </Gutters>
          )}
          <Typography variant="subtitle1">{t('newApp.checkTitle', 'Check')}</Typography>
          <Gutters data-new-app-check>
            {others ? (
              <Notice severity="error">
                {t('newApp.othersId', 'The app id starts with your publisher id: {{publisher}}.<id>', {
                  publisher: publisher.id,
                })}
              </Notice>
            ) : taken ? (
              <Notice severity="error">
                {t(
                  'newApp.taken',
                  'You have published {{id}} already: publish its new releases with the publishing tool.',
                  { id: taken }
                )}
              </Notice>
            ) : problems.length ? (
              <Notice severity="warning">
                <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }} data-manifest-problems>
                  {problems.map(problem => (
                    <li key={problem}>{problem}</li>
                  ))}
                </Box>
              </Notice>
            ) : (
              <Notice severity="success">
                <span data-manifest-ok>{t('newApp.valid', 'remote.it takes this manifest.')}</span>
              </Notice>
            )}
          </Gutters>
          {manifest && json === undefined && (
            <Gutters>
              <Box
                component="pre"
                sx={{
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 320,
                  margin: 0,
                  padding: 1,
                  bgcolor: 'grayLightest.main',
                }}
                data-manifest-preview
              >
                {manifestText(manifest)}
              </Box>
            </Gutters>
          )}
        </>
      )}
    </Container>
  )
}
