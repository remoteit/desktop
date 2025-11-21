import { useState, useCallback } from 'react'
import { Clipboard } from '@capacitor/clipboard'

type ClipboardOptions = {
  copiedTimeout?: number
  onCopied?: () => void
}

const useClipboard = (options: ClipboardOptions = {}) => {
  const { copiedTimeout = 1500, onCopied } = options
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async copyValue => {
      await Clipboard.write({ string: copyValue.toString() })
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        onCopied?.()
      }, copiedTimeout)
    },
    [copiedTimeout, onCopied]
  )

  return { copy, copied }
}

export default useClipboard
