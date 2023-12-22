import { useState, useCallback } from 'react'
import { Clipboard } from '@capacitor/clipboard'

type ClipboardOptions = {
  copiedTimeout?: number
}

const useClipboard = (options: ClipboardOptions = {}) => {
  const { copiedTimeout = 1500 } = options
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async copyValue => {
      await Clipboard.write({ string: copyValue.toString() })
      setCopied(true)
      setTimeout(() => setCopied(false), copiedTimeout)
    },
    [copiedTimeout]
  )

  return { copy, copied }
}

export default useClipboard
