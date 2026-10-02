import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Dispatch } from '../../store'
import { Box, Button, Chip, TextField, Typography } from '@mui/material'
import { Gutters } from '../Gutters'
import { PasswordStep, CodeStep, ChoiceStep, RecoveryCodes } from './steps'
import browser, { leaveTo } from '../../services/browser'
import { PROTOCOL } from '../../constants'
import {
  AccountResult,
  ElevationStatus,
  Factor,
  FactorKind,
  KIND_LABEL,
  StoreStep,
  addSms,
  addStoreFactor,
  addTotp,
  answerElevationStore,
  answerStore,
  confirmStore,
  elevateWithSms,
  elevateWithStore,
  elevateWithTotp,
  elevationReturnTicket,
  elevationStatus,
  preferFactor,
  removeFactor,
  replaceRecoveryCodes,
  requestConfirmation,
  sendElevationText,
  smsOptions,
  totpOptions,
  verifyConfirmation,
} from '../../services/accountSecurity'

/**
 * The factors that prove it's you — two-factor codes and passkeys — held by the AS
 * (permitteer docs/as-elevation.md), or, on a bridged account, by the credential store.
 *
 * Every change is proven first: by the session's elevation stamp (a code from a factor the account
 * holds), by a recovery code for that one change, or — for the account's very first factor — by a
 * code the AS emails. Adding a factor the store will hold asks for the password as well, because
 * the store will not associate one without it; its first factor needs nothing more.
 *
 * A passkey's ceremony is bound to the AS's own origin, so a passkey is added — and confirms it's you —
 * on the AS's page, which comes back here: with `passkey=added` or `passkey=cancelled` for an add.
 */

type Change =
  | { kind: 'add-totp' }
  | { kind: 'add-sms' }
  | { kind: 'add-store'; method: FactorKind }
  | { kind: 'remove'; factor: Factor }
  | { kind: 'prefer'; factor: Factor }
  | { kind: 'codes' }

type Step =
  | { at: 'view' }
  | { at: 'choose'; change?: Change; error?: string }
  | { at: 'email'; change: Change; error?: string }
  | { at: 'elevate-sms'; change?: Change; phone: string; error?: string }
  | { at: 'elevate-store'; change?: Change; store?: Extract<StoreStep, { step: 'relay' }>; error?: string }
  | { at: 'totp'; qr: string; secret: string; error?: string }
  | { at: 'sms-phone'; error?: string }
  | { at: 'sms-code'; phone: string; error?: string }
  | { at: 'store'; method: FactorKind; store?: StoreStep; error?: string }
  | { at: 'codes'; codes: string[] }

/** What a refusal means, in the person's words; the AS's own sentence otherwise. */
function refusal(
  t: (key: string, fallback: string) => string,
  r: Extract<AccountResult<unknown>, { ok: false }>
): string {
  switch (r.error) {
    case 'invalid_code':
      return t('mfa.wrongCode', "That code didn't match — try again.")
    case 'too_many_attempts':
      return t('mfa.locked', 'Too many wrong codes. Codes are locked for 15 minutes.')
    case 'bad_password':
      return t('mfa.wrongPassword', "That password didn't match.")
    case 'elevation_required':
    case 'confirmation_required':
      return t('mfa.proveAgain', 'Confirm it’s you again to continue.')
    case 'sms_unavailable':
      return t('mfa.smsUnavailable', 'Text-message codes are not available right now.')
    case 'store_unavailable':
      return t('mfa.storeUnavailable', 'The service that holds your password could not be reached. Try again soon.')
    default:
      return r.description || t('mfa.failed', 'Something went wrong — try again.')
  }
}

const isElevated = (r: object): r is { elevated: { until: string } } => 'elevated' in r

export const FactorSettings: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ElevationStatus | 'loading' | 'unavailable'>('loading')
  const [step, setStep] = useState<Step>({ at: 'view' })
  // A refusal with no step open to show it in — a change that needed no proof, say.
  const [notice, setNotice] = useState<string>()
  const stepRef = useRef(step)
  stepRef.current = step
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [answer, setAnswer] = useState('')
  const [recovery, setRecovery] = useState('')
  // The proofs a change can spend: the mailed confirmation (first factor) and a recovery code
  // (one change). The elevation stamp lives on the session at the AS and is read from `status`.
  const confirmed = useRef(false)
  const recoveryCode = useRef<string>()

  const load = async () => {
    const r = await elevationStatus()
    setStatus(r.ok ? r.data : 'unavailable')
    return r.ok ? r.data : undefined
  }
  useEffect(() => {
    load()
  }, [])

  // --- the AS's page and back ---------------------------------------------------------------
  const location = useLocation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  /** Where the AS's page sends the person back: this screen. The web app is on a registered origin;
   *  the desktop and mobile apps run that page in the system (or in-app) browser, so the way back is
   *  the app's own scheme, which their deep-link handling routes to the same screen. */
  const returnHere = () =>
    browser.isNative
      ? `${PROTOCOL}${location.pathname.replace(/^\//, '')}`
      : `${window.location.origin}${window.location.pathname}#${location.pathname}`
  // The add's outcome. On the web it arrives on the page's own query (the return URL's hash holds the
  // route); in the apps, on the route's. Read once, then removed, so a reload does not repeat it.
  useEffect(() => {
    const routed = new URLSearchParams(location.search).get('passkey')
    const paged = new URLSearchParams(window.location.search).get('passkey')
    const outcome = routed ?? paged
    if (!outcome) return
    if (routed) history.replace(location.pathname)
    else window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`)
    load()
    if (outcome === 'added') dispatch.ui.set({ successMessage: t('passkeys.added', 'Passkey added') })
  }, [location.search])
  // Whatever happened in the browser — a passkey added, a tab closed half-way — this screen shows
  // what the AS holds when the person comes back to it.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const clearInputs = () => {
    setCode('')
    setPassword('')
    setAnswer('')
    setRecovery('')
  }
  const done = async () => {
    confirmed.current = false
    recoveryCode.current = undefined
    clearInputs()
    setStep({ at: 'view' })
    await load()
  }
  const spent = (codes?: string[]) => (codes?.length ? setStep({ at: 'codes', codes }) : done())

  /** Run a change the proof has already been given for. */
  const run = async (change: Change) => {
    const rc = recoveryCode.current
    setBusy(true)
    try {
      switch (change.kind) {
        case 'add-totp': {
          const r = await totpOptions()
          return r.ok ? setStep({ at: 'totp', qr: r.data.qr, secret: r.data.secret }) : failed(r, change)
        }
        case 'add-sms':
          return setStep({ at: 'sms-phone' })
        case 'add-store':
          return setStep({ at: 'store', method: change.method })
        case 'remove': {
          const r = await removeFactor(change.factor.id, rc)
          return r.ok ? done() : failed(r, change)
        }
        case 'prefer': {
          const r = await preferFactor(change.factor.id, rc)
          return r.ok ? done() : failed(r, change)
        }
        case 'codes': {
          const r = await replaceRecoveryCodes(rc)
          return r.ok ? setStep({ at: 'codes', codes: r.data.recoveryCodes }) : failed(r, change)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  /** A change asks for proof unless the session is elevated or a proof is already in hand. */
  const begin = async (change: Change) => {
    setNotice(undefined)
    const current = (await load()) ?? (status as ElevationStatus)
    if (!current || typeof current === 'string') return
    const factorless = !current.factors.length
    // The store's first factor is proven by the password the store itself checks.
    if (change.kind === 'add-store' && factorless) return run(change)
    if (current.elevated || confirmed.current || recoveryCode.current) return run(change)
    if (factorless) {
      const r = await requestConfirmation()
      return r.ok ? setStep({ at: 'email', change }) : failed(r)
    }
    setStep({ at: 'choose', change })
  }

  /** A refused change or step. A missing proof starts the proof again; anything else is said where it happened. */
  const failed = (r: Extract<AccountResult<unknown>, { ok: false }>, change?: Change) => {
    const error = refusal(t, r)
    if (r.error === 'elevation_required' || r.error === 'confirmation_required') {
      confirmed.current = false
      recoveryCode.current = undefined
      return setStep({ at: 'choose', change, error })
    }
    if (stepRef.current.at === 'view' || stepRef.current.at === 'codes') setNotice(error)
    else setStep({ ...stepRef.current, error } as Step)
  }

  const proven = async (change?: Change) => {
    clearInputs()
    if (change) return run(change)
    await done()
  }

  // --- proving it's you -------------------------------------------------------------------
  const withBusy = async (work: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await work()
    } finally {
      setBusy(false)
    }
  }
  const confirmEmail = (change: Change) =>
    withBusy(async () => {
      const r = await verifyConfirmation(code)
      if (!r.ok) return failed(r, change)
      confirmed.current = true
      await proven(change)
    })
  const elevateTotp = (change?: Change) =>
    withBusy(async () => {
      const r = await elevateWithTotp(code)
      return r.ok ? proven(change) : failed(r, change)
    })
  const textMe = (change?: Change) =>
    withBusy(async () => {
      const r = await sendElevationText()
      return r.ok ? setStep({ at: 'elevate-sms', change, phone: r.data.phone }) : failed(r, change)
    })
  const elevateSms = (change?: Change) =>
    withBusy(async () => {
      const r = await elevateWithSms(code)
      return r.ok ? proven(change) : failed(r, change)
    })
  const elevateStore = (change: Change | undefined, handle?: string) =>
    withBusy(async () => {
      const r = handle ? await answerElevationStore(handle, answer) : await elevateWithStore(password)
      setAnswer('')
      setPassword('')
      if (!r.ok) return failed(r, change)
      if (isElevated(r.data)) return proven(change)
      const store = r.data as Extract<StoreStep, { step: 'relay' }>
      setStep({ at: 'elevate-store', change, store, error: store.error })
    })
  const spendRecovery = (change: Change) => {
    recoveryCode.current = recovery.trim()
    setRecovery('')
    run(change)
  }
  const elevateWithPasskey = () =>
    withBusy(async () => {
      const r = await elevationReturnTicket(returnHere())
      if (r.ok) await leaveTo(r.data.url)
      else failed(r)
    })
  const addPasskey = () =>
    withBusy(async () => {
      setNotice(undefined)
      const r = await elevationReturnTicket(returnHere(), 'add-passkey')
      if (r.ok) await leaveTo(r.data.url)
      else failed(r)
    })

  // --- adding a factor --------------------------------------------------------------------
  const confirmTotp = () =>
    withBusy(async () => {
      const r = await addTotp(code, recoveryCode.current)
      setCode('')
      return r.ok ? spent(r.data.recoveryCodes) : failed(r, { kind: 'add-totp' })
    })
  const sendSms = () =>
    withBusy(async () => {
      const r = await smsOptions(phone)
      return r.ok ? setStep({ at: 'sms-code', phone: r.data.phone }) : failed(r, { kind: 'add-sms' })
    })
  const confirmSms = () =>
    withBusy(async () => {
      const r = await addSms(code, recoveryCode.current)
      setCode('')
      return r.ok ? spent(r.data.recoveryCodes) : failed(r, { kind: 'add-sms' })
    })
  /** The store's conversation: the password, then whatever it asks, then the new factor's code. */
  const storeNext = (method: FactorKind, current?: StoreStep) =>
    withBusy(async () => {
      const r = !current
        ? await addStoreFactor(method, password, method === 'sms' ? phone : undefined, recoveryCode.current)
        : current.step === 'relay'
        ? await answerStore(current.handle, answer)
        : current.step === 'qr' || current.step === 'sms'
        ? await confirmStore(current.handle, code)
        : undefined
      clearInputs()
      if (!r) return
      if (!r.ok) return failed(r, { kind: 'add-store', method })
      if (r.data.step === 'done') return spent(r.data.recoveryCodes)
      setStep({ at: 'store', method, store: r.data, error: r.data.error })
    })

  // --- rendering --------------------------------------------------------------------------
  const cancel = () => done()
  const kindName = (kind: FactorKind) => t(`mfa.method.${kind}`, KIND_LABEL[kind])

  if (status === 'loading') return null
  if (status === 'unavailable')
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {t('mfa.title', 'Two-Factor Authentication')}
        </Typography>
        <Gutters bottom="xl">
          <Typography variant="body2" color="textSecondary">
            {t('mfa.unavailable', 'Your sign-in methods could not be loaded. Reload the page to try again.')}
          </Typography>
        </Gutters>
      </>
    )

  const codeFactors = status.factors.filter(f => f.kind !== 'passkey')
  const passkeys = status.factors.filter(f => f.kind === 'passkey')
  const has = (kind: FactorKind) => status.factors.some(f => f.kind === kind)
  const addsAtStore = (kind: FactorKind) => !!status.store && status.store.offers.includes(kind)
  const storeDown = !!status.store && !status.store.reachable
  const addKind = (kind: 'totp' | 'sms'): Change =>
    addsAtStore(kind) ? { kind: 'add-store', method: kind } : { kind: kind === 'totp' ? 'add-totp' : 'add-sms' }
  const canAddTotp = !has('totp') && !storeDown
  const canAddSms = !has('sms') && (addsAtStore('sms') ? !storeDown : status.smsAvailable)
  const locked = status.lockedUntil && new Date(status.lockedUntil) > new Date()

  const row = (factor: Factor, siblings: Factor[]) => (
    <Box key={factor.id} display="flex" alignItems="center" gap={2} marginBottom={1.5} flexWrap="wrap">
      <Box minWidth={180}>
        <Typography variant="body2">{factor.name}</Typography>
        <Typography variant="caption" color="textSecondary">
          {kindName(factor.kind)}
        </Typography>
      </Box>
      {factor.preferred && <Chip size="small" color="success" label={t('mfa.askedFirst', 'Asked for first')} />}
      {!readOnly && (
        <>
          {!factor.preferred && siblings.length > 1 && (
            <Button size="small" disabled={busy} onClick={() => begin({ kind: 'prefer', factor })}>
              {t('mfa.prefer', 'Ask for this first')}
            </Button>
          )}
          <Button size="small" disabled={busy} onClick={() => begin({ kind: 'remove', factor })}>
            {t('common.remove', 'Remove')}
          </Button>
        </>
      )}
    </Box>
  )
  const sameHome = (factor: Factor) => status.factors.filter(f => (f.home === 'store') === (factor.home === 'store'))

  const stepArea = () => {
    switch (step.at) {
      case 'view':
        return null
      case 'choose':
        return (
          <Chooser
            status={status}
            change={step.change}
            error={step.error}
            busy={busy}
            code={code}
            onCode={setCode}
            recovery={recovery}
            onRecovery={setRecovery}
            onTotp={() => elevateTotp(step.change)}
            onText={() => textMe(step.change)}
            onStore={() => setStep({ at: 'elevate-store', change: step.change })}
            onPasskey={elevateWithPasskey}
            onRecoveryCode={step.change ? () => spendRecovery(step.change!) : undefined}
            onCancel={cancel}
          />
        )
      case 'email':
        return (
          <CodeStep
            prompt={
              <Typography variant="body2" gutterBottom>
                {t(
                  'mfa.emailSent',
                  'We emailed you a code to confirm your first factor. It works for 10 minutes, only in this browser.'
                )}
              </Typography>
            }
            code={code}
            onCode={setCode}
            error={step.error}
            busy={busy}
            onSubmit={() => confirmEmail(step.change)}
            onCancel={cancel}
          />
        )
      case 'elevate-sms':
        return (
          <CodeStep
            prompt={
              <Typography variant="body2" gutterBottom>
                {t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: step.phone })}
              </Typography>
            }
            code={code}
            onCode={setCode}
            error={step.error}
            busy={busy}
            onSubmit={() => elevateSms(step.change)}
            onCancel={cancel}
          />
        )
      case 'elevate-store':
        return step.store ? (
          <StoreAnswer
            store={step.store}
            answer={answer}
            onAnswer={setAnswer}
            error={step.error}
            busy={busy}
            onSubmit={() => elevateStore(step.change, step.store!.handle)}
            onCancel={cancel}
          />
        ) : (
          <PasswordStep
            prompt={t(
              'mfa.storeConfirm',
              'Confirming with the code held where your password lives asks for the password too — it is the only way that service will check the code.'
            )}
            password={password}
            onPassword={setPassword}
            error={step.error}
            busy={busy}
            onSubmit={() => elevateStore(step.change)}
            onCancel={cancel}
          />
        )
      case 'totp':
        return (
          <CodeStep
            prompt={
              <>
                <Typography variant="body2" gutterBottom>
                  {t('mfa.scan', 'Scan with your authenticator app, then enter its 6-digit code.')}
                </Typography>
                <Box marginY={2} bgcolor="white" padding={1} width="fit-content" borderRadius={1}>
                  <img src={step.qr} width={168} height={168} alt="" />
                </Box>
                <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                  {t('mfa.secret', 'Or enter the key manually:')} <code>{step.secret}</code>
                </Typography>
              </>
            }
            code={code}
            onCode={setCode}
            error={step.error}
            busy={busy}
            onSubmit={confirmTotp}
            onCancel={cancel}
          />
        )
      case 'sms-phone':
        return (
          <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
            <TextField
              autoFocus
              variant="filled"
              type="tel"
              label={t('mfa.phone', 'Mobile number (+15555550123)')}
              value={phone}
              onChange={e => setPhone(e.target.value.trim())}
            />
            {step.error && (
              <Typography variant="body2" color="error">
                {step.error}
              </Typography>
            )}
            <Box>
              <Button variant="contained" size="small" disabled={!phone || busy} onClick={sendSms}>
                {t('mfa.textMe', 'Text me a code')}
              </Button>
              <Button size="small" onClick={cancel}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </Box>
          </Gutters>
        )
      case 'sms-code':
        return (
          <CodeStep
            prompt={
              <Typography variant="body2" gutterBottom>
                {t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: step.phone })}
              </Typography>
            }
            code={code}
            onCode={setCode}
            error={step.error}
            busy={busy}
            onSubmit={confirmSms}
            onCancel={cancel}
          />
        )
      case 'store': {
        const { store, method } = step
        if (!store)
          return (
            <PasswordStep
              prompt={t(
                'mfa.storeAdd',
                'Adding a factor changes it where your password lives, so it asks for the password.'
              )}
              password={password}
              onPassword={setPassword}
              error={step.error}
              busy={busy}
              incomplete={method === 'sms' && !phone}
              onSubmit={() => storeNext(method)}
              onCancel={cancel}
            >
              {method === 'sms' && (
                <TextField
                  autoFocus
                  variant="filled"
                  type="tel"
                  label={t('mfa.phone', 'Mobile number (+15555550123)')}
                  value={phone}
                  onChange={e => setPhone(e.target.value.trim())}
                />
              )}
            </PasswordStep>
          )
        if (store.step === 'relay')
          return (
            <StoreAnswer
              store={store}
              answer={answer}
              onAnswer={setAnswer}
              error={step.error}
              busy={busy}
              onSubmit={() => storeNext(method, store)}
              onCancel={cancel}
            />
          )
        if (store.step === 'qr')
          return (
            <CodeStep
              prompt={
                <>
                  <Typography variant="body2" gutterBottom>
                    {t('mfa.scan', 'Scan with your authenticator app, then enter its 6-digit code.')}
                  </Typography>
                  <Box marginY={2} bgcolor="white" padding={1} width="fit-content" borderRadius={1}>
                    <img src={store.qr} width={168} height={168} alt="" />
                  </Box>
                  <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                    {t('mfa.secret', 'Or enter the key manually:')} <code>{store.secret}</code>
                  </Typography>
                </>
              }
              code={code}
              onCode={setCode}
              error={step.error}
              busy={busy}
              onSubmit={() => storeNext(method, store)}
              onCancel={cancel}
            />
          )
        if (store.step === 'sms')
          return (
            <CodeStep
              prompt={
                <Typography variant="body2" gutterBottom>
                  {store.phone
                    ? t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: store.phone })
                    : t(
                        'mfa.smsSent',
                        'We texted a code to your phone — enter it to finish turning on text-message codes.'
                      )}
                </Typography>
              }
              code={code}
              onCode={setCode}
              error={step.error}
              busy={busy}
              onSubmit={() => storeNext(method, store)}
              onCancel={cancel}
            />
          )
        return null
      }
      case 'codes':
        return <RecoveryCodes codes={step.codes} onDone={() => done()} />
    }
  }

  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        {t('mfa.title', 'Two-Factor Authentication')}
      </Typography>
      <Gutters bottom="xl">
        {storeDown && (
          <Typography variant="body2" color="error" gutterBottom>
            {t(
              'mfa.storeDown',
              'The service that holds your password could not be reached, so any factor it holds is not shown here. Nothing has changed.'
            )}
          </Typography>
        )}
        {codeFactors.map(f =>
          row(
            f,
            sameHome(f).filter(g => g.kind !== 'passkey')
          )
        )}
        {locked && (
          <Typography variant="body2" color="error" gutterBottom>
            {t('mfa.lockedUntil', 'Codes are locked until {{when}}.', {
              when: new Date(status.lockedUntil!).toLocaleTimeString(),
            })}
          </Typography>
        )}
        {notice && (
          <Typography variant="body2" color="error" gutterBottom>
            {notice}
          </Typography>
        )}
        {!readOnly && step.at === 'view' && (
          <Box display="flex" gap={1} flexWrap="wrap" marginY={1}>
            {canAddTotp && (
              <Button variant="contained" size="small" onClick={() => begin(addKind('totp'))}>
                {t('mfa.addTotp', 'Add an authenticator app')}
              </Button>
            )}
            {canAddSms && (
              <Button variant="contained" size="small" onClick={() => begin(addKind('sms'))}>
                {t('mfa.addSms', 'Add a text number')}
              </Button>
            )}
            {status.factors.length > 0 && (
              <Button size="small" onClick={() => begin({ kind: 'codes' })}>
                {t('mfa.newCodes', 'New recovery codes')}
              </Button>
            )}
          </Box>
        )}
        <Typography variant="caption" color="textSecondary" display="block">
          {status.factors.length
            ? t(
                'mfa.codesLeft',
                '{{n}} recovery codes left — each manages one change when your phone or key is gone.',
                { n: status.recoveryCodesRemaining }
              )
            : t(
                'mfa.suggest',
                'Protect your account with an authenticator app or text messages. The first one is confirmed by a code we email you.'
              )}
        </Typography>
      </Gutters>
      {!readOnly && stepArea()}

      <Typography variant="subtitle1" gutterBottom>
        {t('passkeys.title', 'Passkeys')}
      </Typography>
      <Gutters bottom="xl">
        {passkeys.map(f => row(f, sameHome(f)))}
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
          {t(
            'passkeys.explainer',
            'A passkey signs you in with a touch instead of a code. Adding one opens your Remote.It sign-in page, then brings you back here.'
          )}
        </Typography>
        {!readOnly && (
          <Button variant="outlined" size="small" disabled={busy} onClick={addPasskey}>
            {t('passkeys.add', 'Add a Passkey')}
          </Button>
        )}
      </Gutters>
    </>
  )
}

/** Confirm it's you with a factor the account holds — or, for a change, a recovery code. */
const Chooser: React.FC<{
  status: ElevationStatus
  change?: Change
  error?: string
  busy: boolean
  code: string
  onCode: (value: string) => void
  recovery: string
  onRecovery: (value: string) => void
  onTotp: () => void
  onText: () => void
  onStore: () => void
  onPasskey: () => void
  onRecoveryCode?: () => void
  onCancel: () => void
}> = props => {
  const { t } = useTranslation()
  const here = props.status.factors.filter(f => f.home !== 'store')
  const hasHere = (kind: FactorKind) => here.some(f => f.kind === kind)
  const hasStore = props.status.factors.some(f => f.home === 'store')
  // The return ticket comes back to this page only on a web origin the app registered.
  const passkeyHere = hasHere('passkey')
  return (
    <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginRight: 1, marginBottom: 1 } }}>
      <Typography variant="body2" gutterBottom>
        {t('mfa.chooserIntro', 'Confirm it’s you to continue.')}
      </Typography>
      {hasHere('totp') && (
        <Box display="flex" alignItems="center" flexWrap="wrap">
          <TextField
            autoFocus
            size="small"
            variant="filled"
            label={t('mfa.authenticatorCode', 'Authenticator code')}
            inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code' }}
            value={props.code}
            onChange={e => props.onCode(e.target.value.trim())}
          />
          <Button
            size="small"
            variant="contained"
            disabled={props.code.length < 6 || props.busy}
            onClick={props.onTotp}
          >
            {t('mfa.useTotp', 'Use authenticator code')}
          </Button>
        </Box>
      )}
      <Box display="flex" gap={1} flexWrap="wrap" marginY={1}>
        {hasHere('sms') && (
          <Button size="small" variant="outlined" disabled={props.busy} onClick={props.onText}>
            {t('mfa.textMe', 'Text me a code')}
          </Button>
        )}
        {hasStore && (
          <Button size="small" variant="outlined" disabled={props.busy} onClick={props.onStore}>
            {t('mfa.useStore', 'Use your password and code')}
          </Button>
        )}
        {passkeyHere && (
          <Button size="small" variant="outlined" disabled={props.busy} onClick={props.onPasskey}>
            {t('mfa.usePasskey', 'Use a passkey')}
          </Button>
        )}
      </Box>
      {props.onRecoveryCode && (
        <Box display="flex" alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            variant="filled"
            label={t('mfa.recoveryCode', 'Recovery code')}
            value={props.recovery}
            onChange={e => props.onRecovery(e.target.value)}
          />
          <Button size="small" disabled={!props.recovery.trim() || props.busy} onClick={props.onRecoveryCode}>
            {t('mfa.useRecovery', 'Use a recovery code')}
          </Button>
        </Box>
      )}
      {props.error && (
        <Typography variant="body2" color="error">
          {props.error}
        </Typography>
      )}
      <Button size="small" onClick={props.onCancel}>
        {t('common.cancel', 'Cancel')}
      </Button>
    </Gutters>
  )
}

/** Whatever the credential store asked: a code, a choice of factor, or a replacement password. */
const StoreAnswer: React.FC<{
  store: Extract<StoreStep, { step: 'relay' }>
  answer: string
  onAnswer: (value: string) => void
  error?: string
  busy: boolean
  onSubmit: () => void
  onCancel: () => void
}> = ({ store, answer, onAnswer, error, busy, onSubmit, onCancel }) => {
  const { t } = useTranslation()
  // A choice starts on the first option, so Continue answers what the screen shows.
  useEffect(() => {
    if (store.options.length && !store.options.includes(answer as FactorKind)) onAnswer(store.options[0])
  }, [store.handle])
  if (store.options.length)
    return (
      <ChoiceStep
        options={store.options}
        choice={(answer as FactorKind) || store.options[0]}
        onChoice={onAnswer}
        error={error}
        busy={busy}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
  if (store.asks === 'new_password')
    return (
      <PasswordStep
        prompt={t('mfa.storeNewPassword', 'The service that holds your password asks you to choose a new one.')}
        label={t('changePassword.newPassword', 'New Password')}
        autoComplete="new-password"
        password={answer}
        onPassword={onAnswer}
        error={error}
        busy={busy}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
  return (
    <CodeStep
      prompt={
        <Typography variant="body2" gutterBottom>
          {store.hint
            ? t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: store.hint })
            : t('mfa.relay', 'Enter the 6-digit code from your current second factor.')}
        </Typography>
      }
      code={answer}
      onCode={onAnswer}
      error={error}
      busy={busy}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}
