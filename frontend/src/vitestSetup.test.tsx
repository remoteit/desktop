import React, { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect } from 'vitest'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

let unmounted = 0
const Effect: React.FC = () => {
  useEffect(() => () => void unmounted++, [])
  return null
}

describe('vitest.setup', () => {
  it('a test leaves its root mounted', async () => {
    await act(async () => createRoot(document.createElement('div')).render(<Effect />))
    expect(unmounted).toBe(0)
  })

  it('and it is unmounted before the next', () => expect(unmounted).toBe(1))
})
