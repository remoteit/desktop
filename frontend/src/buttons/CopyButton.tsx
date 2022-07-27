import React, { useState } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { FontSize, Color } from '../styling'
import { setConnection } from '../helpers/connectionHelper'
import { useClipboard } from 'use-clipboard-copy'
import { Application } from '../shared/applications'
import { PromptModal } from '../components/PromptModal'
import { IconButton } from './IconButton'

export interface CopyButtonProps {
  icon: string
  app?: Application
  title?: string
  value?: string | number
  color?: Color
  size?: FontSize
  type?: IconType
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onCopy?: () => void
}

export const CopyButton: React.FC<CopyButtonProps> = ({ icon, app, value, onCopy, ...props }) => {
  const [open, setOpen] = useState<boolean>(false)
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const autoCopy = useSelector((state: ApplicationState) => state.ui.autoCopy)
  const { ui } = useDispatch<Dispatch>()

  React.useEffect(() => {
    if (autoCopy) {
      check()
      ui.set({ autoCopy: false })
    }
  }, [autoCopy])

  const check = () => {
    app?.prompt ? setOpen(true) : copy()
  }

  const copy = () => {
    clipboard.copy()
    setTimeout(() => {
      onCopy && onCopy()
    }, 600)
  }

  const onSubmit = (tokens: ILookup<string>) => {
    if (app?.connection) setConnection({ ...app.connection, ...tokens })
    setTimeout(copy, 100)
    setOpen(false)
  }

  props.title = clipboard.copied ? 'Copied!' : props.title

  return (
    <>
      <IconButton {...props} onClick={check} icon={clipboard.copied ? 'check' : icon} size="lg" />
      <input type="hidden" ref={clipboard.target} value={value || app?.commandString || ''} />
      {app && <PromptModal app={app} open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />}
    </>
  )
}
