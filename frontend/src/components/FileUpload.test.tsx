import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { dropzone } = vi.hoisted(() => ({ dropzone: { onDrop: undefined as undefined | ((files: File[]) => Promise<void>) } }))
vi.mock('react-dropzone', () => ({
  useDropzone: (options: any) => {
    dropzone.onDrop = options.onDrop
    return { getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false }
  },
}))
vi.mock('react-redux', () => ({ useDispatch: () => ({ ui: { set: vi.fn() } }) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, text: string) => text }),
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick, title }: any) => <button data-clear={title} onClick={onClick} />,
}))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div>{children}</div> }))

import { FileUpload } from './FileUpload'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// An owner that holds the value and can reset it, as a form does once it has saved.
let reset: () => void = () => {}
const FileOwner = () => {
  const [file, setFile] = useState<File | undefined>()
  reset = () => setFile(undefined)
  return <FileUpload mode="file" value={file} onChange={setFile} />
}
const TextOwner = () => {
  const [text, setText] = useState<string | undefined>()
  reset = () => setText(undefined)
  return <FileUpload mode="text" value={text} onChange={value => setText(value)} />
}

async function render(node: React.ReactElement) {
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(node))
  return container
}

const selected = (container: HTMLElement) => container.querySelector('[data-testid="file-upload-selected"]')?.textContent

describe('FileUpload', () => {
  it('a file: shows the name of the file its owner holds — none once the owner resets it, a new one when chosen', async () => {
    const container = await render(<FileOwner />)
    expect(selected(container)).toBeUndefined()
    await act(async () => dropzone.onDrop!([new File(['v1'], 'deploy-v1.sh')]))
    expect(selected(container)).toBe('"deploy-v1.sh" selected')
    // Uploaded: the owner lets the file go. The box no longer names it.
    await act(async () => reset())
    expect(selected(container)).toBeUndefined()
    await act(async () => dropzone.onDrop!([new File(['v2'], 'deploy-v2.sh')]))
    expect(selected(container)).toBe('"deploy-v2.sh" selected')
  })

  it('a text read from a file: its name goes with the value, whoever empties it', async () => {
    const container = await render(<TextOwner />)
    await act(async () => dropzone.onDrop!([new File(['a=1'], 'app.conf')]))
    expect(selected(container)).toBe('"app.conf" selected')
    await act(async () => reset())
    expect(selected(container)).toBeUndefined()
    await act(async () => dropzone.onDrop!([new File(['b=2'], 'other.conf')]))
    expect(selected(container)).toBe('"other.conf" selected')
    await act(async () => (container.querySelector('[data-clear]') as HTMLButtonElement).click())
    expect(selected(container)).toBeUndefined()
  })
})
