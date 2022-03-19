import React from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { DataButton } from '../buttons/DataButton'

type Props = {
  value?: string
  label: string
  showBackground?: boolean
}

export const ListItemCopy: React.FC<Props> = props => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!props.value) return null

  return (
    <>
      <DataButton
        {...props}
        title={clipboard.copied ? 'Copied!' : `Copy ${props.label}`}
        icon={clipboard.copied ? 'check' : 'copy'}
        iconColor={clipboard.copied ? 'success' : undefined}
        onClick={clipboard.copy}
      />
      <input type="hidden" ref={clipboard.target} value={props.value} />
    </>
  )
}
