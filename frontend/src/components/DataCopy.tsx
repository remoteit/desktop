import React from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { DataButton } from '../buttons/DataButton'

export const DataCopy: React.FC<{
  value?: string
  label?: string
  showBackground?: boolean
  fullWidth?: boolean
  gutterBottom?: boolean
}> = props => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!props.value) return null

  return (
    <>
      <DataButton
        {...props}
        title={clipboard.copied ? 'Copied!' : props.label ? `Copy ${props.label}` : 'Copy'}
        icon={clipboard.copied ? 'check' : 'copy'}
        iconColor={clipboard.copied ? 'success' : undefined}
        onClick={clipboard.copy}
      />
      <input type="hidden" ref={clipboard.target} value={props.value} />
    </>
  )
}
