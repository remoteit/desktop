import { disconnectAuthenticated } from './sockets'

describe('backend/sockets disconnectAuthenticated', () => {
  it('drops every signed-in socket and keeps the one still authenticating', () => {
    const owner = { auth: true, disconnect: jest.fn() }
    const popout = { auth: true, disconnect: jest.fn() }
    const switching = { auth: false, disconnect: jest.fn() }
    disconnectAuthenticated(new Map(Object.entries({ owner, popout, switching })).values())
    expect(owner.disconnect).toHaveBeenCalledWith(true)
    expect(popout.disconnect).toHaveBeenCalledWith(true)
    expect(switching.disconnect).not.toHaveBeenCalled()
  })
})
