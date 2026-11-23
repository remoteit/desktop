import { afterEach, vi } from 'vitest'
import type { Root } from 'react-dom/client'

/* A root a test leaves mounted outlives its file's jsdom: a timer it started (an MUI transition's, 225 ms) then updates
   React with no window, and the run fails on the uncaught error with every test passed, when the timing falls so. Each
   test's roots are unmounted as it ends, after its file's own afterEach. A test that renders afresh and empties the
   body still unmounts the root before it first: React takes a portal (a dialog, a menu) out of the body itself. */
const { mounted } = vi.hoisted(() => ({ mounted: new Set<Root>() }))

vi.mock('react-dom/client', async importOriginal => {
  const actual = await importOriginal<typeof import('react-dom/client')>()
  const createRoot: typeof actual.createRoot = (...args) => {
    const root = actual.createRoot(...args)
    const unmount = root.unmount.bind(root)
    mounted.add(root)
    root.unmount = () => {
      mounted.delete(root)
      unmount()
    }
    return root
  }
  return { ...actual, createRoot, default: { ...actual, createRoot } }
})

afterEach(async () => {
  if (!mounted.size) return
  const { act } = await import('react')
  const errors: unknown[] = []
  for (const root of [...mounted]) {
    try {
      await act(async () => root.unmount())
    } catch (error) {
      errors.push(error) // the rest are unmounted all the same: one left mounted fails the tests after this one
    }
  }
  if (errors.length) throw errors[0]
})
