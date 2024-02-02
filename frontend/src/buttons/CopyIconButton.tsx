import React, { useState, useEffect } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, ButtonProps } from './IconButton'
import { updateConnection } from '../helpers/connectionHelper'
import { Sizes, Color } from '../styling'
import { Application } from '@common/applications'
import { PromptModal } from '../components/PromptModal'
import useClipboard from '../hooks/useClipboard'

export type CopyButtonProps = ButtonProps & {
  icon: string
  app?: Application
  title?: string
  value?: string | number
  color?: Color
  colorCopied?: Color
  size?: Sizes
  type?: IconType
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  onCopy?: () => void
}

const COPY_TIMEOUT = 800

export const CopyIconButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ icon, app, value, title, size = 'lg', colorCopied = 'success', onClick, onCopy, ...props }, ref) => {
    const [open, setOpen] = useState<boolean>(false)
    const clipboard = useClipboard({ copiedTimeout: COPY_TIMEOUT })
    const autoCopy = useSelector((state: State) => state.ui.autoCopy)
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
      clipboard.copy(value || app?.commandString || '')
      setTimeout(() => {
        onCopy?.()
      }, COPY_TIMEOUT)
    }

    const onSubmit = (tokens: ILookup<string>) => {
      if (app?.connection) updateConnection(app, { ...app.connection, ...tokens })
      setTimeout(copy, 100)
      setOpen(false)
    }

    const onClose = () => setOpen(false)

    title = clipboard.copied ? 'Copied!' : title

    return (
      <>
        <IconButton
          {...props}
          ref={ref}
          onClick={check}
          color={clipboard.copied ? colorCopied : props.color}
          icon={clipboard.copied ? 'check' : icon}
          title={title}
          size={size}
        />
        {app && <PromptModal app={app} open={open} onClose={onClose} onSubmit={onSubmit} />}
      </>
    )
  }
)
