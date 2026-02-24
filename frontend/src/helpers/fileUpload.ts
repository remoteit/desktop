import { containsNonPrintableChars } from './utilHelper'

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onabort = () => reject(new Error('File reading was aborted'))
    reader.onerror = () => reject(new Error('File reading has failed'))
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(file)
  })

export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onabort = () => reject(new Error('File reading was aborted'))
    reader.onerror = () => reject(new Error('File reading has failed'))
    reader.onload = () => resolve((reader.result as string) || '')
    reader.readAsText(file)
  })

export const containsBinaryData = (buffer: ArrayBuffer): boolean => {
  const text = new TextDecoder().decode(new Uint8Array(buffer))
  return containsNonPrintableChars(text)
}

export const buildDropzoneAcceptFromExtensions = (extensions?: string[]) => {
  if (!extensions?.length) return undefined

  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  }

  const accept: Record<string, string[]> = {}
  extensions.forEach(ext => {
    const normalized = ext.replace(/^\*?\.?/, '').toLowerCase()
    if (!normalized) return
    const dotted = `.${normalized}`
    const mime = mimeMap[dotted] || 'application/octet-stream'
    if (!accept[mime]) accept[mime] = []
    accept[mime].push(dotted)
  })

  return Object.keys(accept).length ? accept : undefined
}
