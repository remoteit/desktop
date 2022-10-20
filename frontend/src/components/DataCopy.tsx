import React from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { DataButton, DataButtonProps } from '../buttons/DataButton'

type Props = Omit<DataButtonProps, 'title' | 'onClick' | 'icon'> & {
  hideIcon?: boolean
}

export const DataCopy: React.FC<Props> = ({ hideIcon, ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!props.value) return null

  return (
    <>
      <DataButton
        {...props}
        title={clipboard.copied ? 'Copied!' : props.label ? `Copy ${props.label}` : 'Copy'}
        icon={hideIcon ? null : clipboard.copied ? 'check' : 'copy'}
        iconColor={clipboard.copied ? 'success' : undefined}
        onClick={clipboard.copy}
      />
      <input type="hidden" ref={clipboard.target} value={props.value} />
    </>
  )
}
