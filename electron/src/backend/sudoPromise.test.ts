const mockExec = jest.fn()

jest.mock('@vscode/sudo-prompt', () => ({ exec: (...args: any[]) => mockExec(...args) }))

import { sudoPromise } from './sudoPromise'

describe('backend/sudoPromise', () => {
  beforeEach(() => mockExec.mockReset())

  it('resolves with the command output', async () => {
    mockExec.mockImplementation((_command, _options, callback) => callback(undefined, 'out', 'err'))
    await expect(sudoPromise('echo hi')).resolves.toEqual({ stdout: 'out', stderr: 'err' })
  })

  it('rejects with the callback error', async () => {
    mockExec.mockImplementation((_command, _options, callback) => callback(new Error('User did not grant permission.')))
    await expect(sudoPromise('echo hi')).rejects.toThrow('User did not grant permission.')
  })

  it('rejects instead of hanging when exec throws synchronously', async () => {
    mockExec.mockImplementation(() => {
      throw new TypeError('Node.util.isObject is not a function')
    })
    await expect(sudoPromise('echo hi')).rejects.toThrow('Node.util.isObject is not a function')
  })
})
