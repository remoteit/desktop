import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider, createTheme } from '@mui/material/styles'

vi.mock('../../helpers/uiHelper', () => ({ createColor: () => 1 }))
vi.mock('../../models/labels', () => ({ labelLookup: { 1: { color: '#5c6bc0' } } }))

import { Avatar, Props } from './Avatar'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// The palette entries the avatar reads.
const color = { main: '#ffffff' }
const theme = createTheme({ palette: { alwaysWhite: color, white: color } } as any)

async function render(props: Props) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(
      <ThemeProvider theme={theme}>
        <Avatar {...props} />
      </ThemeProvider>
    )
  )
  return container
}

const img = (c: HTMLElement) => c.querySelector('img')
const letter = (c: HTMLElement) => c.querySelector('.MuiAvatar-root > div')?.textContent
const shown = (c: HTMLElement) => getComputedStyle(img(c)!).visibility === 'visible'
const fire = (c: HTMLElement, type: 'load' | 'error') => act(async () => void img(c)!.dispatchEvent(new Event(type)))

describe('Avatar', () => {
  it('shows the letter while the picture is pending, hiding the picture', async () => {
    const c = await render({ email: 'evan@example.com' })
    expect(letter(c)).toBe('E')
    expect(img(c)!.getAttribute('src')).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[0-9a-f]{32}\?s=72&d=404$/)
    expect(shown(c)).toBe(false)
  })

  it('keeps the letter after the picture fails', async () => {
    const c = await render({ email: 'evan@example.com' })
    await fire(c, 'error')
    expect(letter(c)).toBe('E')
    expect(shown(c)).toBe(false)
  })

  it('shows the picture over the letter once it has loaded', async () => {
    const c = await render({ email: 'evan@example.com' })
    await fire(c, 'load')
    expect(shown(c)).toBe(true)
    expect(letter(c)).toBe('E')
  })

  it('takes a picture of its own, or none', async () => {
    const c = await render({ email: 'a@example.com', src: 'https://pictures.example/a.png', fallback: 'Zed' })
    expect(img(c)!.getAttribute('src')).toBe('https://pictures.example/a.png')
    expect(letter(c)).toBe('Z')
    const none = await render({ email: 'a@example.com', src: null })
    expect(img(none)).toBeNull()
    expect(letter(none)).toBe('A')
  })
})
