import React, { act } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { GridListItem } from './GridListItem'

const theme = createTheme()
Object.assign(theme.palette, {
  white: { main: '#fff' },
  primaryHighlight: { main: '#edf8ff' },
  primaryLighter: { main: '#d6efff' },
})

it('keeps the first column in a grouped row and omits it when the list has no required column', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const previousActEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  try {
    await act(async () => {
      root.render(
        <ThemeProvider theme={theme}>
          <GridListItem required={null}>
            <div>Grouped service</div>
          </GridListItem>
          <GridListItem>
            <div>Run status</div>
          </GridListItem>
        </ThemeProvider>
      )
    })
    const [grouped, unpinned] = container.querySelectorAll('.MuiListItemButton-root')
    expect(grouped.firstElementChild?.classList.contains('GridList-pinned')).toBe(true)
    expect(grouped.children[1].textContent).toBe('Grouped service')
    expect(unpinned.querySelector('.GridList-pinned')).toBeNull()
    expect(unpinned.firstElementChild?.textContent).toBe('Run status')
  } finally {
    await act(async () => root.unmount())
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
  }
})
