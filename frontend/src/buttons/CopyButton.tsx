import React, { useState, useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { FontSize, Color } from '../styling'
import { setConnection } from '../helpers/connectionHelper'
import { useClipboard } from 'use-clipboard-copy'
import { Application } from '../shared/applications'
import { PromptModal } from '../components/PromptModal'
import { IconButton, ButtonProps } from './IconButton'

export type CopyButtonProps = ButtonProps & {
  icon: string
  app?: Application
  title?: string
  value?: string | number
  color?: Color
  size?: FontSize
  type?: IconType
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  onCopy?: () => void
}

const COPY_TIMEOUT = 1000

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ icon, app, value, title, onClick, onCopy, ...props }, ref) => {
    // export const CopyButton: React.FC<CopyButtonProps> = ({ icon, app, value, title, onCopy, ...props }) => {
    const [open, setOpen] = useState<boolean>(false)
    const clipboard = useClipboard({ copiedTimeout: COPY_TIMEOUT })
    const autoCopy = useSelector((state: ApplicationState) => state.ui.autoCopy)
    const { ui } = useDispatch<Dispatch>()

    useEffect(() => {
      if (autoCopy) {
        check()
        ui.set({ autoCopy: false })
      }
    }, [autoCopy])

    const check = () => {
      onClick?.()
      app?.prompt ? setOpen(true) : copy()
    }

    const copy = () => {
      clipboard.copy()
      setTimeout(() => {
        onCopy?.()
      }, COPY_TIMEOUT)
    }

    const onSubmit = (tokens: ILookup<string>) => {
      if (app?.connection) setConnection({ ...app.connection, ...tokens })
      setTimeout(copy, 100)
      setOpen(false)
    }

    title = clipboard.copied ? 'Copied!' : title

    return (
      <>
        <IconButton
          {...props}
          ref={ref}
          onClick={check}
          icon={clipboard.copied ? 'check' : icon}
          title={title}
          size="lg"
        />
        <input type="hidden" ref={clipboard.target} value={value || app?.commandString || ''} />
        {app && <PromptModal app={app} open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />}
      </>
    )
  }
)
