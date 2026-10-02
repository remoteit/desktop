import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { openSSH, SSHSession } from '../services/browserClient'

/* A terminal on a device's SSH service through this browser's remote.it client — nothing to install
   (services/browserClient). Opened in its own tab: /terminal?name=<subnet name>&port=22&title=…. It asks who to log
   in as, then the password or the server's own questions, and an unknown host key, in the terminal itself, as ssh
   does; none of them is kept, but an accepted host key, by the client. */
export const TerminalPage: React.FC = () => {
  const box = useRef<HTMLDivElement>(null)
  const params = new URLSearchParams(useLocation().search)
  const name = params.get('name') || ''
  const port = Number(params.get('port') || 22)
  const title = params.get('title') || name

  useEffect(() => {
    if (!box.current || !name) return
    document.title = title
    const term = new Terminal({ cursorBlink: true, fontSize: 14, convertEol: false, theme: { background: '#111111' } })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(box.current)
    fit.fit()
    const onResize = () => fit.fit()
    window.addEventListener('resize', onResize)

    // A line typed here, before there is a session: shown as typed, or not (a password).
    let line: ((ch: string) => void) | undefined
    const readLine = (prompt: string, echo: boolean) =>
      new Promise<string>(resolve => {
        term.write(prompt)
        let text = ''
        line = ch => {
          if (ch === '\r') {
            term.write('\r\n')
            line = undefined
            resolve(text)
          } else if (ch === '\x7f') {
            if (text) {
              text = text.slice(0, -1)
              if (echo) term.write('\b \b')
            }
          } else if (ch === '\x03') {
            term.write('^C\r\n')
            line = undefined
            resolve('')
          } else if (ch >= ' ') {
            text += ch
            if (echo) term.write(ch)
          }
        }
      })

    let session: SSHSession | undefined
    let live = false
    const typed = term.onData(data => {
      if (live && session) return session.input(new TextEncoder().encode(data))
      for (const ch of data) line?.(ch)
    })
    const resized = term.onResize(({ cols, rows }) => session?.resize(cols, rows))

    ;(async () => {
      term.write(`\x1b[2m${name}:${port} — through remote.it, in this browser\x1b[0m\r\n`)
      const user = (await readLine('login as: ', true)).trim()
      if (!user) return term.write('No user name: closed.\r\n')
      term.write('\x1b[2mconnecting…\x1b[0m\r\n')
      session = await openSSH(
        { name, port, user, cols: term.cols, rows: term.rows },
        {
          open: () => {
            live = true
            term.focus()
          },
          data: bytes => term.write(bytes),
          end: () => {
            live = false
            term.write('\r\n\x1b[2mConnection closed.\x1b[0m\r\n')
          },
          error: message => {
            live = false
            term.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`)
          },
          ask: async (instruction, questions) => {
            if (instruction) term.write(instruction + '\r\n')
            const answers: string[] = []
            for (const q of questions) answers.push(await readLine(q.prompt, q.echo))
            return answers
          },
          hostKey: async key => {
            term.write(
              `The host key of ${key.host} is not known yet.\r\n${key.type} key fingerprint is ${key.fingerprint}.\r\n`
            )
            const answer = (await readLine('Are you sure you want to continue connecting (yes/no)? ', true)).trim()
            return answer.toLowerCase() === 'yes'
          },
        }
      ).catch(err => {
        term.write(`\r\n\x1b[31m${err.message}\x1b[0m\r\n`)
        return undefined
      })
    })()

    return () => {
      typed.dispose()
      resized.dispose()
      window.removeEventListener('resize', onResize)
      session?.close()
      term.dispose()
    }
  }, [name, port])

  return <Box ref={box} sx={{ position: 'fixed', inset: 0, bgcolor: '#111111', padding: 1 }} />
}
