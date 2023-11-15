import React, { useState, useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { updateConnection } from '../helpers/connectionHelper'
import { FontSize, Color } from '../styling'
import { useClipboard } from 'use-clipboard-copy'
import { Application } from '@common/applications'
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

const COPY_TIMEOUT = 1600

export const CopyIconButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ icon, app, value, title, size = 'lg', onClick, onCopy, ...props }, ref) => {
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
      if (app?.connection) updateConnection(app, { ...app.connection, ...tokens })
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
          color={clipboard.copied ? 'success' : props.color}
          icon={clipboard.copied ? 'check' : icon}
          title={title}
          size={size}
        >
          <input type="hidden" ref={clipboard.target} value={value || app?.commandString || ''} />
        </IconButton>
        {app && <PromptModal app={app} open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />}
      </>
    )
  }
)
