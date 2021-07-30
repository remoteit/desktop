import React from 'react'
import { FontSize, Color } from '../styling'
import { useClipboard } from 'use-clipboard-copy'
import { IconButton } from './IconButton'

export interface CopyButtonProps {
  icon: string
  title: string
  value?: string | number
  color?: Color
  size?: FontSize
  type?: IconType
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onCopy?: () => void
}

export const CopyButton: React.FC<CopyButtonProps> = ({ icon, value = '', onCopy, ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  const copy = () => {
    clipboard.copy()
    setTimeout(() => {
      onCopy && onCopy()
    }, 600)
  }

  props.title = clipboard.copied ? 'Copied!' : props.title

  return (
    <>
      <IconButton {...props} onClick={copy} icon={clipboard.copied ? 'check' : icon} />
      <input type="hidden" ref={clipboard.target} value={value} />
    </>
  )
}
