import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
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
import { State } from '../store'
import { Notice } from './Notice'
import { CopyIconButton } from '../buttons/CopyIconButton'
import browser, { windowOpen } from '../services/browser'
import { radius, spacing } from '../styling'

export const AgentOutdatedNotice: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => {
  const { t } = useTranslation()
  const outdated = useSelector((state: State) => state.binaries.outdated)
  const [dismissed, setDismissed] = useState<string>()
  const [open, setOpen] = useState<boolean>(false)

  if (!outdated || !browser.isElectron || browser.isRemote) return null

  const shown = `${outdated.installedVersion}:${outdated.expectedVersion}`
  const appName = brand.appName
  const email = brand.package?.author?.email ?? 'support@remote.it'
  const values = { ...outdated, appName, email }
  const details = [
    `${appName} ${outdated.appVersion} (Windows ${outdated.arch})`,
    `Agent on disk: ${outdated.installedVersion} (${outdated.path})`,
    `Agent expected: ${outdated.expectedVersion}`,
    `Agent running: ${outdated.agentVersion || 'unknown'}`,
    `Installer log: ${outdated.installerLog}`,
    `App log: ${outdated.appLog}`,
  ].join('\n')

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
            {t('agentOutdated.notice', {
              ...values,
              defaultValue:
                'The {{appName}} system agent on this computer is out of date. Reinstall {{appName}} to update it.',
            })}
          </Notice>
        }
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('agentOutdated.title', { ...values, defaultValue: 'Update the {{appName}} system agent' })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {t('agentOutdated.body', {
              ...values,
              defaultValue:
                "This computer is running system agent {{installedVersion}}, and {{appName}} {{appVersion}} needs {{expectedVersion}}. Connections keep working, but features that need the newer agent won't until it is updated.",
            })}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('agentOutdated.why', {
              ...values,
              defaultValue:
                "The system agent comes with the {{appName}} installer, so reinstalling {{appName}} updates it and keeps your settings and devices. Re-install system agent in Options can't update it.",
            })}
          </Typography>
          <Box component="ol" sx={{ paddingLeft: 3, marginY: 1 }}>
            <Typography variant="body2" component="li">
              {t('agentOutdated.stepDownload', {
                ...values,
                defaultValue: 'Download the {{arch}} installer for {{appName}} {{appVersion}}.',
              })}
            </Typography>
            <Typography variant="body2" component="li">
              {t('agentOutdated.stepRun', {
                ...values,
                defaultValue:
                  'Run it and follow the prompts. It needs administrator permission and asks to close {{appName}} first.',
              })}
            </Typography>
            <Typography variant="body2" component="li">
              {t('agentOutdated.stepSupport', {
                ...values,
                defaultValue: 'If this message comes back, email {{email}} with the details below.',
              })}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              marginTop: `${spacing.md}px`,
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: `${radius.sm}px`,
              bgcolor: 'grayLightest.main',
            }}
          >
            <Typography
              variant="caption"
              component="pre"
              sx={{
                flexGrow: 1,
                margin: 0,
                fontFamily: "'Roboto Mono', monospace",
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {details}
            </Typography>
            <CopyIconButton value={details} title={t('agentOutdated.copyDetails', 'Copy details')} size="md" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={() => setOpen(false)}>
            {t('common.close', 'Close')}
          </Button>
          <Button variant="contained" color="primary" onClick={() => windowOpen(outdated.releaseUrl, '_blank', true)}>
            {t('agentOutdated.download', 'Download installer')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
