import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Button, Typography } from '@mui/material'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { openSSH, resetBrowserClient, SSHSession } from '../services/browserClient'
import { graphQLBasicRequest } from '../services/graphQL'

/* A terminal on a device's SSH service through this browser's remote.it client — nothing to install
   (services/browserClient). Opened in its own tab: /terminal?name=<subnet name>&port=22&title=…&service=<id>. It asks
   who to log in as; a device with SSH certificates on lets you in by a certificate for minutes, for a key made for the
   session, when its account lets you be that user (graphql sshCertificate) — otherwise the password or the server's
   own questions are asked, and an unknown host key, in the terminal itself, as ssh does; none of them is kept, but an
   accepted host key, by the client. A session that fails, or does not open in RESET_OFFER_MS, offers to reset this
   browser's client — one whose device was removed cannot sign in again — and opens the terminal anew. */
const RESET_OFFER_MS = 20_000

export const TerminalPage: React.FC = () => {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const pasteTarget = useRef<(text: string) => void>()
  const params = new URLSearchParams(useLocation().search)
  const name = params.get('name') || ''
  const port = Number(params.get('port') || 22)
  const title = params.get('title') || name
  const serviceId = params.get('service') || ''
  const [offerReset, setOfferReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [canPaste, setCanPaste] = useState(false)
  const [pasteFailed, setPasteFailed] = useState(false)

  const paste = async () => {
    const target = pasteTarget.current
    if (!target) return
    setPasteFailed(false)
    // Safari needs the clipboard read to start during the tap, and may ask the user to confirm it.
    const text = await navigator.clipboard?.readText().catch(() => undefined)
    if (target !== pasteTarget.current) return
    if (text === undefined) setPasteFailed(true)
    else if (text) target(text)
  }

  const reset = async () => {
    setResetting(true)
    await resetBrowserClient().catch(() => {})
    window.location.reload()
  }

  useEffect(() => {
    if (!box.current || !name) return
    document.title = title
    const term = new Terminal({ cursorBlink: true, fontSize: 14, convertEol: false, theme: { background: '#111111' } })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(box.current)
    fit.fit()
    const observer = new ResizeObserver(() => fit.fit())
    observer.observe(box.current)

    let disposed = false
    let receiveInput: ((data: string) => void) | undefined
    const setInput = (receive?: (data: string) => void) => {
      if (disposed) return
      receiveInput = receive
      pasteTarget.current =
        receive &&
        (text => {
          term.paste(text)
          term.focus()
        })
      setCanPaste(!!receive)
      setPasteFailed(false)
    }
    setInput()

    // A line typed here, before there is a session: shown as typed, or not (a password).
    const readLine = (prompt: string, echo: boolean) =>
      new Promise<string>(resolve => {
        if (disposed) return resolve('')
        term.write(prompt)
        let text = ''
        setInput(data => {
          for (const ch of data) {
            if (ch === '\r') {
              term.write('\r\n')
              setInput()
              return resolve(text)
            } else if (ch === '\x7f') {
              if (text) {
                text = text.slice(0, -1)
                if (echo) term.write('\b \b')
              }
            } else if (ch === '\x03') {
              term.write('^C\r\n')
              setInput()
              return resolve('')
            } else if (ch >= ' ') {
              text += ch
              if (echo) term.write(ch)
            }
          }
        })
      })

    let session: SSHSession | undefined
    let offerTimer: ReturnType<typeof setTimeout> | undefined
    const typed = term.onData(data => receiveInput?.(data))
    const resized = term.onResize(({ cols, rows }) => session?.resize(cols, rows))

    ;(async () => {
      term.write(`\x1b[2m${name}:${port} — through remote.it, in this browser\x1b[0m\r\n`)
      // Their own account on the device, when they have one; otherwise asked, as ssh does.
      const own = serviceId
        ? await graphQLBasicRequest(
            ` query SshLogin($serviceId: String!) {
                sshAccount(serviceId: $serviceId)
                sshHostKey(serviceId: $serviceId)
              }`,
            { serviceId }
          )
        : 'ERROR'
      if (disposed) return
      const account = own === 'ERROR' ? null : own?.data?.data?.sshAccount
      // The host key the device reports for the app serving it (graphql sshHostKey): one that matches is let through,
      // another refused.
      const expectedHostKey: string = (own === 'ERROR' ? null : own?.data?.data?.sshHostKey) || ''
      if (account) term.write(`login as: ${account}\r\n`)
      const user = account || (await readLine('login as: ', true)).trim()
      if (disposed) return
      if (!user) return term.write('No user name: closed.\r\n')
      term.write('\x1b[2mconnecting…\x1b[0m\r\n')
      offerTimer = setTimeout(() => setOfferReset(true), RESET_OFFER_MS)
      session = await openSSH(
        { name, port, user, cols: term.cols, rows: term.rows },
        {
          open: () => {
            if (disposed) return
            setInput(data => session?.input(new TextEncoder().encode(data)))
            clearTimeout(offerTimer)
            setOfferReset(false)
            term.focus()
          },
          data: bytes => term.write(bytes),
          end: () => {
            if (disposed) return
            setInput()
            term.write('\r\n\x1b[2mConnection closed.\x1b[0m\r\n')
          },
          error: message => {
            if (disposed) return
            setInput()
            term.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`)
            setOfferReset(true)
          },
          ask: async (instruction, questions) => {
            if (instruction) term.write(instruction + '\r\n')
            const answers: string[] = []
            for (const q of questions) answers.push(await readLine(q.prompt, q.echo))
            return answers
          },
          hostKey: async key => {
            if (expectedHostKey) {
              if (key.fingerprint === expectedHostKey) return true
              term.write(
                `\x1b[31mThe host key of ${key.host} (${key.fingerprint}) is not the one the device reports (${expectedHostKey}): refused.\x1b[0m\r\n`
              )
              return false
            }
            term.write(
              `The host key of ${key.host} is not known yet.\r\n${key.type} key fingerprint is ${key.fingerprint}.\r\n`
            )
            const answer = (await readLine('Are you sure you want to continue connecting (yes/no)? ', true)).trim()
            return answer.toLowerCase() === 'yes'
          },
          certificate: async publicKey => {
            if (!serviceId) return null
            const result = await graphQLBasicRequest(
              ` mutation SshCertificate($serviceId: String!, $publicKey: String!, $login: String!) {
                  sshCertificate(serviceId: $serviceId, publicKey: $publicKey, login: $login)
                }`,
              { serviceId, publicKey, login: user }
            )
            return result === 'ERROR' ? null : result?.data?.data?.sshCertificate ?? null
          },
        }
      ).catch(err => {
        if (disposed) return undefined
        setInput()
        term.write(`\r\n\x1b[31m${err.message}\x1b[0m\r\n`)
        setOfferReset(true)
        return undefined
      })
      if (disposed) session?.close()
    })()

    return () => {
      disposed = true
      pasteTarget.current = undefined
      clearTimeout(offerTimer)
      typed.dispose()
      resized.dispose()
      observer.disconnect()
      session?.close()
      term.dispose()
    }
  }, [name, port, serviceId])

  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#111111', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: 1 }}>
        {pasteFailed && (
          <Typography role="status" variant="body2" sx={{ color: 'white', mr: 'auto' }}>
            {t('terminal.pasteFailed', 'Could not read the clipboard.')}
          </Typography>
        )}
        <Button
          variant="contained"
          size="small"
          disabled={!name || !canPaste}
          onClick={paste}
          sx={{ display: 'none', '@media (any-pointer: coarse)': { display: 'inline-flex', minHeight: 44 } }}
        >
          {t('terminal.paste', 'Paste')}
        </Button>
        {offerReset && (
          <Button variant="contained" size="small" disabled={resetting} onClick={reset}>
            {resetting ? 'Resetting…' : "Reset this browser's remote.it client"}
          </Button>
        )}
      </Box>
      <Box ref={box} sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 1 }} />
    </Box>
  )
}
