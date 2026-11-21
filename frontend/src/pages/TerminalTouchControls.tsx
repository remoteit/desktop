import React, { useId, useLayoutEffect, useRef, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Terminal } from '@xterm/xterm'
import { Icon } from '../components/Icon'

function terminalText(terminal: Terminal) {
  const buffer = terminal.buffer.active
  let text = ''
  for (let index = 0; index < buffer.length; index++) {
    const line = buffer.getLine(index)
    if (!line) break
    if (index > 0 && !line.isWrapped) text += '\n'
    text += line.translateToString(!buffer.getLine(index + 1)?.isWrapped)
  }
  return text.replace(/\n+$/, '')
}

export function TerminalTouchControls({ terminal, inputAvailable }: { terminal: Terminal; inputAvailable: boolean }) {
  const { t } = useTranslation()
  const dock = useRef<HTMLDivElement>(null)
  const transcript = useRef<HTMLDivElement>(null)
  const transcriptTitle = useId()
  const [output, setOutput] = useState<string>()
  const inputLabel = t('terminal.input', 'Terminal input')
  const selectLabel = t('terminal.selectText', 'Select terminal text')
  const hideLabel = t('terminal.hideKeyboard', 'Hide keyboard')

  useLayoutEffect(() => {
    const textarea = terminal.textarea
    const originalParent = textarea?.parentElement
    if (!textarea || !originalParent || !dock.current) return

    // Keep xterm's keyboard, IME, and bracketed-paste handling on the native input.
    dock.current.append(textarea)
    const preventDefaultPaste = (event: ClipboardEvent) => event.preventDefault()
    textarea.addEventListener('paste', preventDefaultPaste)
    return () => {
      textarea.removeEventListener('paste', preventDefaultPaste)
      if (originalParent.isConnected) {
        originalParent.append(textarea)
        textarea.removeAttribute('placeholder')
        textarea.readOnly = !!terminal.options.disableStdin
      } else {
        textarea.remove()
      }
    }
  }, [terminal])

  useLayoutEffect(() => {
    const textarea = terminal.textarea
    if (!textarea) return
    textarea.placeholder = inputLabel
    textarea.setAttribute('aria-label', inputLabel)
    textarea.readOnly = !inputAvailable
  }, [terminal, inputAvailable, inputLabel])

  const showOutput = () => {
    terminal.blur()
    setOutput(terminalText(terminal))
  }

  return (
    <>
      <Box
        sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1, py: 0.75, bgcolor: '#191919', color: '#e0e0e0' }}
      >
        <Box
          ref={dock}
          sx={{
            flex: 1,
            minWidth: 0,
            '& textarea': {
              display: 'block',
              position: 'static',
              width: '100% !important',
              height: '44px !important',
              lineHeight: '24px !important',
              boxSizing: 'border-box',
              resize: 'none',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              border: '1px solid #525252',
              borderRadius: 1,
              bgcolor: '#222',
              p: '9px 10px',
              font: '16px monospace',
              // The remote terminal echoes input. The scratch value must stay hidden for password prompts.
              color: 'transparent',
              caretColor: '#e0e0e0',
              '&::placeholder': { color: '#b5b5b5' },
              '&:focus': { outline: '2px solid #8bbbf5', outlineOffset: -2 },
              '&:read-only': { opacity: 0.5 },
            },
          }}
        />
        <IconButton
          color="inherit"
          title={hideLabel}
          aria-label={hideLabel}
          onMouseDown={event => event.preventDefault()}
          onClick={() => terminal.blur()}
          sx={{ width: 44, height: 44 }}
        >
          <Icon name="keyboard-down" currentColor />
        </IconButton>
        <IconButton
          color="inherit"
          title={selectLabel}
          aria-label={selectLabel}
          onMouseDown={event => event.preventDefault()}
          onClick={showOutput}
          sx={{ width: 44, height: 44 }}
        >
          <Icon name="copy" currentColor />
        </IconButton>
      </Box>
      <Dialog
        fullScreen
        open={output !== undefined}
        aria-labelledby={transcriptTitle}
        onClose={() => setOutput(undefined)}
        TransitionProps={{
          onEntered: () => {
            if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight
          },
        }}
        PaperProps={{ sx: { bgcolor: '#111111', color: '#e0e0e0' } }}
      >
        <DialogTitle id={transcriptTitle}>{selectLabel}</DialogTitle>
        <DialogContent ref={transcript}>
          <Box
            component="pre"
            sx={{
              m: 0,
              font: '14px/1.4 monospace',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
          >
            {output}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOutput(undefined)} sx={{ color: '#b5d7ff' }}>
            {t('common.done', 'Done')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
