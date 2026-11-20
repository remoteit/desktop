import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, Prompt, useHistory } from 'react-router-dom'
import { Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { LoadingMessage } from '../components/LoadingMessage'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { NewAppForm } from '../components/NewAppForm'
import { Inputs, NewAppFiles } from '../components/NewAppFiles'
import { NewAppPublish } from '../components/NewAppPublish'
import { Built, buildRelease, Given, offeredPlatforms, ReleaseRefused } from '../helpers/appRelease'
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
   rules graphql takes a release by and devices hold it to (helpers/appManifest, vendored from remoteit/apps); then its
   files for each platform, packed here (helpers/appRelease); then Review and sign, where the publisher signs it with
   their key file in the signer and it is published as the new private app's first release; then Done, with Add to a
   device. Nothing is sent to remote.it until it is published, and the key never is. Needs the account's publisher
   (the Publisher page claims one) and a standing key to sign with (Create key there). The account admin's, as the
   Publisher page is.

   Each account is its own New app: the flow is keyed by the account, so switching organizations ends the last one's
   — its form, its files, a release packing or packed, a publish under way — and nothing of it can land in the new
   one's (an answer for a flow that has ended changes nothing). */
export const NewAppPage: React.FC = () => {
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  return <NewAppFlow key={account ?? ''} account={account} />
}

const NewAppFlow: React.FC<{ account?: string }> = ({ account }) => {
  const { t } = useTranslation()
  const [read, setRead] = useState<{ publisher: AppPublisher | null; publishing: AppPublishing } | null>()
  const [form, setForm] = useState<AppForm>(newAppForm)
  // Edit as JSON: the manifest's text, the source while it is set.
  const [json, setJson] = useState<string>()
  const [step, setStep] = useState<'describe' | 'files' | 'review' | 'done'>('describe')
  const [inputs, setInputs] = useState<Inputs>({})
  const [icon, setIcon] = useState<File>()
  const [packing, setPacking] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const [built, setBuilt] = useState<Built>()
  const [published, setPublished] = useState<{ manifest: string; devices: number }>()
  // A release being signed or published is held still: no going back to change it meanwhile.
  const [publishing, setPublishing] = useState(false)
  const history = useHistory()

  useEffect(() => {
    let current = true
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
      if (parsed && typeof parsed === 'object' && ('archives' in parsed || 'icon' in parsed))
        twice.push(t('newApp.archivesGiven', 'archives and icon are written when the files are packed: leave them out'))
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

  const fileMax = read?.publishing.fileMax || 16 << 20
  const id = typeof manifest?.app === 'string' ? manifest.app : ''
  const others = publisher && id && !id.startsWith(`${publisher.id}.`)
  // A new app's id is one its publisher has not published: a new release of one is the publishing tool's.
  const taken = publisher?.apps.some(app => app.id === id) ? id : undefined
  const ready = !!manifest && !problems.length && !others && !taken
  const dirty = json !== undefined || JSON.stringify(form) !== JSON.stringify(newAppForm())

  // The release packed from the platforms' files, or why it cannot be, in the person's words.
  const pack = async () => {
    // Only the platforms the manifest runs on now: one chosen before run.command changed is no longer offered, nor packed.
    const offered = offeredPlatforms(manifest!)
    const chosen = Object.fromEntries(Object.entries(inputs).filter(([key]) => offered.includes(key)))
    const missing = Object.keys(chosen).find(key => !chosen[key])
    if (missing) return setRefusal(t('newApp.noFilesFor', '{{platform}}: no files yet', { platform: missing }))
    setPacking(true)
    setRefusal(undefined)
    try {
      setBuilt(await buildRelease(manifest!, chosen as Record<string, Given>, fileMax, icon))
      setStep('review')
    } catch (error) {
      setRefusal(error instanceof ReleaseRefused ? refusalWords(t, error) : (error as Error).message)
    } finally {
      setPacking(false)
    }
  }

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
          <Prompt
            when={dirty && step !== 'done'}
            message={t('newApp.leave', 'Leave New app? What you have entered here is not kept.')}
          />
          {!standing.length && step !== 'done' && (
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
          {step === 'describe' && (
            <>
              <Gutters bottom={null}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={json !== undefined}
                      onChange={e =>
                        setJson(e.target.checked ? manifestText(manifestOf(form, publisher.id)) : undefined)
                      }
                      data-edit-json
                    />
                  }
                  label={t(
                    'newApp.editJson',
                    'Edit as JSON (any contract-1 manifest: named listeners, several services)'
                  )}
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
              <Gutters>
                <Button variant="contained" disabled={!ready} onClick={() => setStep('files')} data-new-app-continue>
                  {t('newApp.continue', 'Continue: files')}
                </Button>
              </Gutters>
            </>
          )}
          {step === 'files' && manifest && (
            <>
              <NewAppFiles
                manifest={manifest}
                inputs={inputs}
                fileMax={fileMax}
                onChange={setInputs}
                icon={icon}
                onIcon={setIcon}
              />
              {refusal && (
                <Notice severity="error" gutterBottom onClose={() => setRefusal(undefined)}>
                  <span data-pack-refusal>{refusal}</span>
                </Notice>
              )}
              <Gutters>
                <Button
                  disabled={packing}
                  onClick={() => setStep('describe')}
                  sx={{ marginRight: 1 }}
                  data-new-app-back
                >
                  {t('newApp.back', 'Back')}
                </Button>
                <Button variant="contained" disabled={packing} onClick={pack} data-new-app-pack>
                  {packing ? t('newApp.packing', 'Packing…') : t('newApp.pack', 'Continue: review and sign')}
                </Button>
              </Gutters>
            </>
          )}
          {step === 'review' && built && (
            <>
              <NewAppPublish
                built={built}
                publisher={publisher.id}
                keys={standing}
                onBusy={setPublishing}
                onPublished={result => {
                  setPublished(result)
                  setStep('done')
                }}
              />
              <Gutters>
                <Button disabled={publishing} onClick={() => setStep('files')} data-new-app-back>
                  {t('newApp.back', 'Back')}
                </Button>
              </Gutters>
            </>
          )}
          {step === 'done' && built && published && (
            <Gutters data-new-app-done>
              <Notice severity="success" gutterBottom>
                {t('newApp.published', '{{app}} {{version}} is published, for this account’s devices.', {
                  app: built.manifest.app,
                  version: built.manifest.version,
                })}
              </Notice>
              <Button
                variant="contained"
                onClick={() => history.push(`/apps/${built.manifest.app}/add`)}
                sx={{ marginRight: 1 }}
                data-new-app-add
              >
                {t('newApp.addToDevice', 'Add to a device')}
              </Button>
              <Button onClick={() => history.push(`/apps/${built.manifest.app}`)} data-new-app-open>
                {t('newApp.openApp', 'Open the app')}
              </Button>
            </Gutters>
          )}
        </>
      )}
    </Container>
  )
}

// A release that cannot be packed, said in the person's words.
function refusalWords(t: (key: string, text: string, values?: any) => string, error: ReleaseRefused): string {
  const v = error.values
  switch (error.code) {
    case 'oneFileSeveral':
      return t(
        'newApp.refusedOneFileSeveral',
        '{{platform}}: the manifest runs several programs there: give a folder or a .tar.gz',
        v
      )
    case 'oneFileNoProgram':
      return t(
        'newApp.refusedOneFileNoProgram',
        '{{platform}}: the manifest runs no program of the app’s own there: give a folder or a .tar.gz',
        v
      )
    case 'badArchive':
      return t('newApp.refusedBadArchive', '{{platform}}: the .tar.gz cannot be used: {{why}}', v)
    case 'badPath':
      return t('newApp.refusedBadPath', '{{platform}}: {{path}} is not a path an archive may hold', v)
    case 'emptyFolder':
      return t('newApp.refusedEmptyFolder', '{{platform}}: the folder is empty', v)
    case 'tooMuch':
      return t('newApp.refusedTooMuch', 'That is {{mb}} MB of files: the page packs at most {{most}} MB in all.', v)
    case 'noPlatform':
      return t('newApp.refusedNoPlatform', 'Choose at least one platform and give its files.', v)
    case 'noCommandFor':
      return t('newApp.refusedNoCommandFor', '{{platform}}: the manifest runs nothing there', v)
    case 'noProgram':
      return t(
        'newApp.refusedNoProgram',
        '{{platform}}: its files have no {{program}}, the program the manifest runs',
        v
      )
    case 'tooBig':
      return t(
        'newApp.refusedTooBig',
        '{{platform}}: the archive is {{mb}} MB; remote.it takes at most {{most}} MB a file',
        v
      )
    case 'badIcon':
      return t('newApp.refusedBadIcon', 'The icon {{problem}}', v)
    case 'archivesGiven':
      return t('newApp.archivesGiven', 'archives and icon are written when the files are packed: leave them out', v)
    case 'tooMany':
      return t('newApp.refusedTooMany', 'At most {{most}} archives', v)
    default:
      return t('newApp.refusedRules', '{{platform}}: {{problems}}', v)
  }
}
