import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { openChatPopout } from './chatPopout'

/* The popout is a second window of the same bundle, told who it is — and, since round 4,
   which account it is for — entirely through its URL. These pin that contract at the source. */
describe('chatPopout — openChatPopout', () => {
  beforeEach(() => window.sessionStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('names the window per owning tab and hands the account scope over in the URL', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    expect(openChatPopout('org-1')).toBe(true)
    const [url, name] = open.mock.calls[0]
    const query = new URL(url as string).searchParams
    const id = query.get('chatPopout')
    expect(id).toBeTruthy()
    // The opener's scope rides along so the popout can boot under it instead of the personal
    // account its unset activeId would default to.
    expect(query.get('chatPopoutScope')).toBe('org-1')
    // Per-OWNER name: a constant name let a second main tab's window.open reuse and navigate
    // the first tab's popup, orphaning that tab's handle.
    expect(name).toBe(`remoteit-chat-${id}`)
    // Remembered so a re-click from this tab re-targets the same window.
    expect(window.sessionStorage.getItem('chatPopoutOwner')).toBe(id)
  })

  it('re-targets the same id (and window name) on a second click from the same tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    openChatPopout('org-1')
    openChatPopout('org-1')
    const ids = open.mock.calls.map(([url]) => new URL(url as string).searchParams.get('chatPopout'))
    expect(ids[0]).toBe(ids[1])
    expect(open.mock.calls[0][1]).toBe(open.mock.calls[1][1])
  })

  it('omits the scope param when there is none', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    openChatPopout()
    expect(new URL(open.mock.calls[0][0] as string).searchParams.has('chatPopoutScope')).toBe(false)
  })

  it('reports a blocked popup and remembers no owner', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    expect(openChatPopout('org-1')).toBe(false)
    expect(window.sessionStorage.getItem('chatPopoutOwner')).toBeNull()
  })
})
