import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import { Dispatch, State } from '../store'
import { graphQLDeleteAccount, graphQLRequestAccountDeletion } from '../services/graphQLMutation'
import { GraphQLInlineResult } from '../services/graphQL'
import { OwnedDevices, OwnedDevicesList, otherOwnedDevices } from './OwnedDevicesList'
import { ListItemCheckbox } from './ListItemCheckbox'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { spacing } from '../styling'
import sleep from '../helpers/sleep'

const CODE_LENGTH = 6
const MAX_ATTEMPTS = 5
const SIGN_OUT_DELAY = 3000

type Step = 'devices' | 'feedback' | 'confirm' | 'done'
type Busy = 'sending' | 'unregistering' | 'deleting'

type Props = {
  open: boolean
  owned?: OwnedDevices
  thisId?: string
  onShowInstructions: () => void
  onClose: () => void
}

export const DeleteAccountDialog: React.FC<Props> = ({ open, owned, thisId, onShowInstructions, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const user = useSelector((state: State) => state.user)
  const connections = useSelector((state: State) => state.connections.all)
  const [step, setStep] = useState<Step>('devices')
  const [acknowledged, setAcknowledged] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [body, setBody] = useState('')
  const [contact, setContact] = useState(true)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [failures, setFailures] = useState(0)
  const [busy, setBusy] = useState<Busy>()
  const [error, setError] = useState<string>()

  const unregisterThisDevice = !!(owned?.thisDeviceOwned && thisId)
  const others = owned && otherOwnedDevices(owned, thisId)
  const locked = !!busy || step === 'done'

  const REASONS = [
    t('deleteAccountSection.reasonUnsupportedDevice', 'My device isn’t supported'),
    t('deleteAccountSection.reasonInstallDifficult', 'Installation was too difficult'),
    t('deleteAccountSection.reasonConnectionQuality', 'Connection quality or performance issues'),
    t('deleteAccountSection.reasonCouldntGetOnline', 'Couldn’t get my device online'),
    t('deleteAccountSection.reasonCouldntConnect', 'Couldn’t connect'),
    t('deleteAccountSection.reasonCost', 'Cost of service'),
    t('deleteAccountSection.reasonAnotherAccount', 'Have another account'),
    t('deleteAccountSection.reasonTooHard', 'Too hard to use'),
    t('deleteAccountSection.reasonNotExpected', 'Not what I thought it was'),
    t('deleteAccountSection.reasonNotUsing', 'Not using it anymore'),
    t('deleteAccountSection.reasonUsingSomethingElse', 'Using something else'),
  ]

  useEffect(() => {
    if (!open) return
    setStep('devices')
    setAcknowledged(false)
    setCodeSent(false)
    setCode('')
    setFailures(0)
    setError(undefined)
  }, [open])

  const refusal = (result: GraphQLInlineResult) =>
    result.message
      ? result.message.charAt(0).toUpperCase() + result.message.slice(1)
      : t('deleteAccountDialog.genericError', 'Something went wrong. Please try again.')

  const goTo = (next: Step) => {
    setError(undefined)
    setStep(next)
  }

  const toggleReason = (reason: string) =>
    setReasons(reasons.includes(reason) ? reasons.filter(r => r !== reason) : [...reasons, reason])

  const sendCode = async () => {
    setError(undefined)
    setBusy('sending')
    const result = await graphQLRequestAccountDeletion()
    setBusy(undefined)
    if (!result.ok) return setError(refusal(result))
    setCodeSent(true)
    setCode('')
    setFailures(0)
  }

  const sendFeedback = async () => {
    if (!reasons.length && !body.trim()) return
    dispatch.feedback.set({
      subject: `Account deleted: ${user.email}`,
      body,
      data: {
        email: user.email,
        userId: user.id,
        reasons,
        contactMe: contact ? 'Yes' : 'No',
        createdDate: user.created?.toLocaleString(navigator.language, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        lastConnections: connections.slice(0, 5),
      },
      snackbar: t('deleteAccountDialog.doneTitle', 'Your account has been deleted'),
    })
    await dispatch.feedback.sendFeedback()
  }

  const deleteAccount = async () => {
    setError(undefined)

    if (unregisterThisDevice) {
      setBusy('unregistering')
      if (!(await dispatch.backend.unregisterThisDevice())) {
        setBusy(undefined)
        return setError(
          t(
            'deleteAccountDialog.unregisterFailed',
            "This device couldn't be unregistered, so your account was not deleted. Try again, or unregister this device from its device page first."
          )
        )
      }
    }

    setBusy('deleting')
    const result = await graphQLDeleteAccount(code)
    setBusy(undefined)

    if (!result.ok) {
      const attempts = result.code === 'NOT_AUTHORIZED' ? failures + 1 : MAX_ATTEMPTS
      setFailures(attempts)
      setCode('')
      if (attempts < MAX_ATTEMPTS)
        return setError(t('deleteAccountDialog.invalidCode', 'That code is incorrect or has expired.'))
      setCodeSent(false)
      return setError(
        result.code === 'NOT_AUTHORIZED'
          ? t('deleteAccountDialog.tooManyAttempts', 'Too many incorrect codes. Request a new code to try again.')
          : refusal(result)
      )
    }

    setStep('done')
    await sendFeedback()
    await sleep(SIGN_OUT_DELAY)
    dispatch.auth.signOut()
  }

  const busyLabel = {
    sending: t('deleteAccountDialog.sending', 'Sending…'),
    unregistering: t('deleteAccountDialog.unregistering', 'Unregistering this device…'),
    deleting: t('deleteAccountDialog.deleting', 'Deleting…'),
  }

  const consequences = [
    {
      icon: 'hdd',
      text: t('deleteAccountDialog.consequenceDevices', 'The devices you own are removed from your account'),
    },
    {
      icon: 'industry-alt',
      text: t('deleteAccountDialog.consequenceOrganization', 'Your organization and its roles are deleted'),
    },
    {
      icon: 'user-friends',
      text: t(
        'deleteAccountDialog.consequenceShares',
        'Devices shared with you and your memberships in other organizations are removed'
      ),
    },
    { icon: 'sign-out', text: t('deleteAccountDialog.consequenceSignIn', 'Your sign-in and access keys stop working') },
  ]

  return (
    <Dialog open={open} onClose={locked ? undefined : onClose} maxWidth="sm" fullWidth>
      {step === 'devices' && (
        <>
          <DialogTitle>
            {t('deleteAccountDialog.devicesTitle', 'Remote.It will keep running on your devices')}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              {t(
                'deleteAccountDialog.devicesBody',
                "Deleting your account removes your devices from it, but it doesn't uninstall Remote.It. The software keeps running on every device it's installed on until you remove it."
              )}
            </Typography>
            {owned && others && others.devices.length > 0 && (
              <Box marginTop={2}>
                <Typography variant="h5">
                  {t('deleteAccountDialog.devicesOwned', {
                    count: others.total,
                    defaultValue: 'You own {{count}} devices',
                  })}
                </Typography>
                <OwnedDevicesList owned={owned} thisId={thisId} />
              </Box>
            )}
            {unregisterThisDevice && (
              <Notice severity="info" fullWidth gutterTop>
                {t('deleteAccountDialog.thisDevice', 'This device will be unregistered when your account is deleted.')}
              </Notice>
            )}
            <Box marginTop={2}>
              <ListItemCheckbox
                disableGutters
                checked={acknowledged}
                label={t(
                  'deleteAccountDialog.acknowledge',
                  "I understand that Remote.It stays installed and running on my devices, and deleting my account won't remove it."
                )}
                onClick={setAcknowledged}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button onClick={onShowInstructions} sx={{ marginRight: 'auto' }}>
              {t('deleteAccountSection.removeButton', 'How to remove Remote.It')}
            </Button>
            <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
            <Button variant="contained" color="error" disabled={!acknowledged} onClick={() => goTo('feedback')}>
              {t('common.continue', 'Continue')}
            </Button>
          </DialogActions>
        </>
      )}

      {step === 'feedback' && (
        <>
          <DialogTitle>
            <Box
              sx={{
                fontSize: 105,
                lineHeight: '1em',
                float: 'right',
                marginRight: -1,
                marginTop: -1,
                marginBottom: -3,
                marginLeft: 1,
              }}
            >
              &#x1F97A;
            </Box>
            {t('deleteAccountDialog.feedbackTitle', 'Why are you leaving?')}
            <Typography variant="body2" marginTop={1}>
              <i>{t('deleteAccountSection.confirmSorry', 'We are sorry to see you go!')} </i>
              <br />
              {t(
                'deleteAccountDialog.feedbackOptional',
                "Optional — telling us why it didn't work out helps us improve."
              )}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <List disablePadding>
              {REASONS.map(reason => (
                <ListItemCheckbox
                  key={reason}
                  label={reason}
                  height={spacing.xl}
                  checked={reasons.includes(reason)}
                  disableGutters
                  onClick={() => toggleReason(reason)}
                />
              ))}
            </List>
            <TextField
              multiline
              fullWidth
              rows={3}
              label={t('deleteAccountSection.otherReasonLabel', 'Other Reason')}
              variant="filled"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <ListItemCheckbox
              disableGutters
              label={t(
                'deleteAccountSection.contactMeLabel',
                "I'm open to having someone contact me about my feedback."
              )}
              checked={contact}
              onClick={setContact}
            />
          </DialogContent>
          <DialogActions sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button onClick={() => goTo('devices')} sx={{ marginRight: 'auto' }}>
              {t('common.back', 'Back')}
            </Button>
            <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
            <Button variant="contained" color="error" onClick={() => goTo('confirm')}>
              {t('common.continue', 'Continue')}
            </Button>
          </DialogActions>
        </>
      )}

      {step === 'confirm' && (
        <>
          <DialogTitle>{t('deleteAccountDialog.confirmTitle', 'Delete your account')}</DialogTitle>
          <DialogContent>
            <List dense disablePadding>
              {consequences.map(({ icon, text }) => (
                <ListItem key={icon} disableGutters>
                  <ListItemIcon>
                    <Icon name={icon} size="md" />
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItem>
              ))}
            </List>
            <Notice severity="error" fullWidth gutterTop gutterBottom>
              {t('deleteAccountDialog.permanent', "This happens immediately and can't be undone.")}
            </Notice>
            {codeSent ? (
              <>
                <Typography variant="body2" marginTop={2} gutterBottom>
                  {t('deleteAccountDialog.codeSent', {
                    email: user.email,
                    defaultValue: 'Enter the code we sent to {{email}}. It expires in 10 minutes.',
                  })}
                </Typography>
                <TextField
                  fullWidth
                  autoFocus
                  value={code}
                  disabled={!!busy}
                  placeholder={t('deleteAccountDialog.codePlaceholder', 'Code')}
                  onChange={e =>
                    setCode(
                      e.target.value
                        .replace(/[^A-Za-z0-9]/g, '')
                        .toUpperCase()
                        .slice(0, CODE_LENGTH)
                    )
                  }
                  onKeyDown={e => e.key === 'Enter' && code.length === CODE_LENGTH && !busy && deleteAccount()}
                  inputProps={{
                    maxLength: CODE_LENGTH,
                    autoComplete: 'one-time-code',
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
                  }}
                />
                <Button size="small" disabled={!!busy} onClick={sendCode} sx={{ marginTop: 1 }}>
                  {t('deleteAccountDialog.resendCode', 'Send a new code')}
                </Button>
              </>
            ) : (
              <Typography variant="body2" marginTop={2}>
                {t('deleteAccountDialog.codeIntro', {
                  email: user.email,
                  defaultValue: "To confirm, we'll email a code to {{email}}.",
                })}
              </Typography>
            )}
            {error && (
              <Notice severity="error" fullWidth gutterTop>
                {error}
              </Notice>
            )}
          </DialogContent>
          <DialogActions sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button disabled={!!busy} onClick={() => goTo('feedback')} sx={{ marginRight: 'auto' }}>
              {t('common.back', 'Back')}
            </Button>
            <Button disabled={!!busy} onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            {codeSent ? (
              <Button
                variant="contained"
                color="error"
                disabled={!!busy || code.length !== CODE_LENGTH}
                onClick={deleteAccount}
              >
                {busy ? busyLabel[busy] : t('deleteAccountDialog.deleteButton', 'Delete account permanently')}
              </Button>
            ) : (
              <Button variant="contained" color="error" disabled={!!busy} onClick={sendCode}>
                {busy ? busyLabel[busy] : t('deleteAccountDialog.sendCode', 'Email me a code')}
              </Button>
            )}
          </DialogActions>
        </>
      )}

      {step === 'done' && (
        <DialogContent>
          <Box textAlign="center" paddingY={4}>
            <Icon name="check-circle" size="xxl" color="success" />
            <Typography variant="h2" marginTop={2} gutterBottom>
              {t('deleteAccountDialog.doneTitle', 'Your account has been deleted')}
            </Typography>
            <Typography variant="body2" color="GrayText">
              {t('deleteAccountDialog.doneBody', 'Thank you for using Remote.It. Signing you out…')}
            </Typography>
          </Box>
        </DialogContent>
      )}
    </Dialog>
  )
}
