import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  SxProps,
  Theme,
  Typography,
} from '@mui/material'
import brand from '@common/brand/config'
import { Dispatch, State } from '../store'
import { Notice } from './Notice'
import { CopyCodeBlock } from './CopyCodeBlock'
import { version as appVersion } from '../helpers/versionHelper'
import { selectUpdateNotice } from '../selectors/ui'
import browser, { windowOpen } from '../services/browser'

export const AgentOutdatedNotice: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const {
    outdated,
    installed,
    installedVersion,
    version: expectedVersion,
    path,
  } = useSelector((state: State) => state.binaries)
  const updateReady = useSelector(selectUpdateNotice)
  const signedIn = useSelector((state: State) => !!state.auth.user)
  const [dismissed, setDismissed] = useState<string>()
  const [open, setOpen] = useState<boolean>(false)

  if (!outdated || !installed || updateReady || !browser.isElectron || browser.isRemote) return null

  const shown = `${installedVersion}:${expectedVersion}`
  const appName = brand.appName
  const email = brand.package?.author?.email ?? 'support@remote.it'
  const values = { appName, appVersion, installedVersion, expectedVersion, arch: outdated.arch, email }
  const details = [
    `${appName} ${appVersion} (Windows ${outdated.arch})`,
    `Agent on disk: ${installedVersion} (${path})`,
    `Agent expected: ${expectedVersion}`,
    `Agent running: ${outdated.agentVersion || 'unknown'}`,
    `Installer log: ${outdated.installerLog}`,
    `App log: ${outdated.appLog}`,
  ].join('\n')

  const close = () => {
    setOpen(false)
    setDismissed(shown)
  }

  const report = async () => {
    close()
    await dispatch.feedback.set({
      subject: `Out-of-date system agent ${installedVersion}`,
      data: { appVersion, installedVersion, expectedVersion, path, ...outdated },
    })
    history.push('/feedback')
  }

  return (
    <>
      <Snackbar
        open={dismissed !== shown && !open}
        sx={sx}
        message={
          <Notice
            severity="warning"
            invert
            fullWidth
            onClose={() => setDismissed(shown)}
            button={
              <Button size="small" variant="contained" color="primary" onClick={() => setOpen(true)}>
                {t('agentOutdated.details', 'Details')}
              </Button>
            }
          >
            {t(
              'agentOutdated.notice',
              'The {{appName}} system agent on this computer is out of date. Reinstall {{appName}} to update it.',
              values
            )}
          </Notice>
        }
      />
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{t('agentOutdated.title', 'Update the {{appName}} system agent', values)}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {t(
              'agentOutdated.body',
              "This computer is running system agent {{installedVersion}}, and {{appName}} {{appVersion}} needs {{expectedVersion}}. Connections keep working, but features that need the newer agent won't until it is updated.",
              values
            )}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t(
              'agentOutdated.why',
              "The system agent comes with the {{appName}} installer, so reinstalling {{appName}} updates it and keeps your settings and devices. Re-install system agent in Options can't update it.",
              values
            )}
          </Typography>
          <Box component="ol" sx={{ paddingLeft: 3, marginY: 1 }}>
            <Typography variant="body2" component="li">
              {t(
                'agentOutdated.stepDownload',
                'Download the {{arch}} installer for {{appName}} {{appVersion}}.',
                values
              )}
            </Typography>
            <Typography variant="body2" component="li">
              {t(
                'agentOutdated.stepRun',
                'Run it and follow the prompts. It needs administrator permission and asks to close {{appName}} first.',
                values
              )}
            </Typography>
            <Typography variant="body2" component="li">
              {signedIn
                ? t(
                    'agentOutdated.stepReport',
                    'If this message comes back, choose Report issue to send support the details below.',
                    values
                  )
                : t(
                    'agentOutdated.stepSupport',
                    'If this message comes back, email {{email}} with the details below.',
                    values
                  )}
            </Typography>
          </Box>
          <CopyCodeBlock
            value={details}
            hideCopyLabel
            display={
              <Box component="span" sx={{ typography: 'caption', fontFamily: "'Roboto Mono', monospace" }}>
                {details}
              </Box>
            }
            sx={{ marginTop: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={close}>
            {t('common.close', 'Close')}
          </Button>
          {signedIn && (
            <Button color="primary" onClick={report}>
              {t('agentOutdated.reportIssue', 'Report issue')}
            </Button>
          )}
          <Button variant="contained" color="primary" onClick={() => windowOpen(outdated.releaseUrl, '_blank', true)}>
            {t('agentOutdated.download', 'Download installer')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
