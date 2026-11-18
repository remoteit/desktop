import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { AppPublisher, AppPublishing, graphQLAppPublisher } from '../services/graphQLAppPublishers'
import { starterArchive } from '../helpers/appStarter'

/* Build it yourself (/apps/build; presence-server docs/device-apps-new-app.md): the same publishing from a terminal,
   a script or CI, with remoteit-app (remoteit/apps tools/) — the steps, the key file the Publisher page made (the
   same file, and its passphrase from the environment where nobody is there to type it), a starter app to begin from,
   and where to get the tool. Linked from New app and the Publisher page. */

// The publishing tool's package, where a stage hosts it: its downloads (open: presence-server
// docs/device-apps-new-app.md, "Open for Evan").
export const toolUrl = (downloads: string) => `${downloads.replace(/\/+$/, '')}/tools/remoteit-app.tgz`

export const BuildAppPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  const [read, setRead] = useState<{ publisher: AppPublisher | null; publishing: AppPublishing } | null>()

  useEffect(() => {
    let current = true
    graphQLAppPublisher(account).then(answer => current && setRead(answer ?? null))
    return () => {
      current = false
    }
  }, [account])

  // The publisher the starter and the steps are named for: none until it is read, and then the account's or none.
  const id = read?.publisher?.id
  const publisher = id ?? '<publisher>'
  const downloads = read?.publishing.downloads

  const downloadStarter = async () => {
    if (!id) return
    const bytes = await starterArchive(id)
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/gzip' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `${publisher}.hello-starter.tar.gz` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const code = (text: string) => (
    <Box
      component="pre"
      sx={{ fontSize: 12, overflow: 'auto', margin: '4px 0 12px', padding: 1, bgcolor: 'grayLightest.main' }}
    >
      {text}
    </Box>
  )

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('buildApp.title', 'Build it yourself')}</Title>
        </Typography>
      }
    >
      <Gutters>
        <Typography variant="body2" gutterBottom>
          {t(
            'buildApp.intro',
            'Publish from a terminal, a script or CI with remoteit-app, the publishing tool. It builds, signs and publishes exactly as New app does — the same manifest, the same packing, the same key file — and it signs on your own machine.'
          )}{' '}
          <Link to="/apps/new">{t('buildApp.newAppLink', 'Or make the app here.')}</Link>
        </Typography>
      </Gutters>

      <Typography variant="subtitle1">{t('buildApp.toolTitle', '1. Get the tool')}</Typography>
      <Gutters data-build-tool>
        <Typography variant="body2" color="textSecondary">
          {t('buildApp.toolNeeds', 'It needs Node.js 20.11 or later.')}
        </Typography>
        {downloads ? (
          <>
            {code(`npm install -g ${toolUrl(downloads)}`)}
            <Button size="small" variant="outlined" href={toolUrl(downloads)} data-build-tool-download>
              {t('buildApp.toolDownload', 'Download the tool')}
            </Button>
          </>
        ) : (
          <Notice severity="info">
            {t('buildApp.toolNotHere', 'This stage does not host the publishing tool. Ask remote.it for it.')}
          </Notice>
        )}
      </Gutters>

      <Typography variant="subtitle1">{t('buildApp.keyTitle', '2. Your key and your account')}</Typography>
      <Gutters>
        <Typography variant="body2" color="textSecondary">
          {t(
            'buildApp.key',
            'Use the key file you downloaded with Create key on the Publisher page. Its passphrase is asked for on the terminal; in CI, put it in REMOTEIT_APP_KEY_PASSPHRASE as a secret. The tool speaks for your account with an access key (Account, Access Keys), kept in ~/.remoteit/credentials as the remote.it CLI keeps it.'
          )}
        </Typography>
        {code(
          `export REMOTEIT_APP_KEY=~/Downloads/${publisher}-app-key-<id>.pem\nremoteit-app key show       # its id: one of your publisher's keys`
        )}
      </Gutters>

      <Typography variant="subtitle1">
        {t('buildApp.appTitle', '3. Start from the starter, or your own app')}
      </Typography>
      <Gutters>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t(
            'buildApp.starter',
            'A web page with a title its owner sets: its manifest, its program and its release notes.'
          )}
        </Typography>
        {read && !id ? (
          <Notice
            severity="info"
            button={<Link to="/account/publisher">{t('buildApp.claimLink', 'Publisher page')}</Link>}
          >
            <span data-build-claim>
              {t('buildApp.claimFirst', 'Claim a publisher id first: the starter is named after it.')}
            </span>
          </Notice>
        ) : (
          <Button size="small" variant="outlined" disabled={!id} onClick={downloadStarter} data-build-starter>
            {t('buildApp.starterDownload', 'Download the starter')}
          </Button>
        )}
        {code(
          `tar xzf ${publisher}.hello-starter.tar.gz && cd hello\nremoteit-app validate          # the manifest, against the contract\nremoteit-app run . --set title=Hi   # the app on this machine, as the device runs it`
        )}
      </Gutters>

      <Typography variant="subtitle1">{t('buildApp.publishTitle', '4. Build, sign and publish')}</Typography>
      <Gutters>
        {code(
          `remoteit-app build --version 1.0.0 any=.\nremoteit-app sign    dist/${publisher}.hello/1.0.0\nremoteit-app upload  dist/${publisher}.hello/1.0.0\nremoteit-app release dist/${publisher}.hello/1.0.0`
        )}
        <Typography variant="body2" color="textSecondary">
          {t(
            'buildApp.publish',
            'build packs a .tar.gz per platform (linux-arm64=out/arm64/ windows-amd64=out/win/ …) and checks it as remote.it does; sign signs the manifest with your key; upload puts the files on remote.it; release makes it the release your devices with the app are given. The app is private: this account’s devices only.'
          )}
        </Typography>
      </Gutters>

      <Typography variant="subtitle1">{t('buildApp.whyTitle', 'Why sign on your own machine')}</Typography>
      <Gutters>
        <Typography variant="body2" color="textSecondary">
          {t(
            'buildApp.why',
            'In the portal your key is used in a separate, sealed frame that cannot send anything anywhere, but a web page runs the code its site serves at that moment. The tool is code you install once and run on your machine: choose it if you would rather not trust a web page with your key.'
          )}
        </Typography>
      </Gutters>
    </Container>
  )
}
