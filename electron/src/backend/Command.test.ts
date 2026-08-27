const mockExec = jest.fn()

jest.mock('child_process', () => {
  const { promisify } = require('util')
  const exec: any = () => {}
  exec[promisify.custom] = (command: string) => mockExec(command)
  return { exec }
})

import Command from './Command'
import AirBrake from './AirBrake'

const notify = AirBrake.notify as jest.Mock

const AUTH_HASH = '8832A2155D371EB9806FDF682C42480D0AA085DD'

function failWith(message: string) {
  mockExec.mockImplementation(() => {
    const error: any = new Error(`Command failed: ${message}`)
    error.stderr = message
    error.stdout = ''
    return Promise.reject(error)
  })
}

describe('backend/Command', () => {
  beforeEach(() => {
    notify.mockClear()
    mockExec.mockReset()
  })

  describe('secrets', () => {
    test('does not send the auth hash to Airbrake', async () => {
      failWith(`{"code":9001,"message":"scrub test"}`)
      await new Command({ command: `remoteit --authhash ${AUTH_HASH} status` }).exec()

      expect(notify).toHaveBeenCalledTimes(1)
      expect(JSON.stringify(notify.mock.calls[0][0])).not.toContain(AUTH_HASH)
      expect(notify.mock.calls[0][0].params.exec).toContain('--authhash [CLEARED]')
    })

    test('scrubs the auth hash out of the reported error message', async () => {
      failWith(`Command failed: remoteit --authhash ${AUTH_HASH} version: not found`)
      await new Command({ command: 'remoteit version' }).exec()

      expect(notify.mock.calls[0][0].error.message).not.toContain(AUTH_HASH)
    })
  })

  describe('reportable errors', () => {
    test('reports a genuine CLI failure', async () => {
      failWith(`{"code":11,"message":"config - can't decrypt file"}`)
      await new Command({ command: 'remoteit status' }).exec()

      expect(notify).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['12', 'config - you must be signed in to perform this operation'],
      ['101', 'agent not reachable'],
      ['101001', 'agent version mismatch, client=4.1.0, agent=4.0.9'],
      ['7003', 'cmd - you must run this command with elevated privileges'],
    ])('does not report expected CLI code %s', async (code, message) => {
      failWith(`{"code":${code},"message":"${message}"}`)
      await new Command({ command: 'remoteit status' }).exec()

      expect(notify).not.toHaveBeenCalled()
    })

    test('does not report when reporting is disabled', async () => {
      failWith(`{"code":9002,"message":"disabled test"}`)
      await new Command({ command: 'gnome-terminal', report: false }).exec()

      expect(notify).not.toHaveBeenCalled()
    })

    test('does not report output on stderr when the command succeeds', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: 'TigerVNC viewer v1.15.0 -- DecodeManager: Detected 12 cores' })
      const onError = jest.fn()
      await new Command({ command: 'vncviewer', onError }).exec()

      expect(notify).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('deduplication', () => {
    test('reports distinct shell errors that share the name "Error"', async () => {
      failWith('guake: command not found')
      await new Command({ command: 'guake' }).exec()
      failWith('konsole: command not found')
      await new Command({ command: 'konsole' }).exec()

      expect(notify).toHaveBeenCalledTimes(2)
    })

    test('reports the same failure only once per run', async () => {
      failWith(`{"code":9003,"message":"repeat test"}`)
      await new Command({ command: 'remoteit status' }).exec()
      await new Command({ command: 'remoteit status' }).exec()

      expect(notify).toHaveBeenCalledTimes(1)
    })

    test('collapses one failure that varies only by id or port', async () => {
      failWith(`{"code":9004,"message":"can't add connection 90:00:00:00:00:0D:F2:FC on port 33008"}`)
      await new Command({ command: 'remoteit connection add' }).exec()
      failWith(`{"code":9004,"message":"can't add connection 90:00:00:00:00:25:D8:BE on port 33112"}`)
      await new Command({ command: 'remoteit connection add' }).exec()

      expect(notify).toHaveBeenCalledTimes(1)
    })
  })
})
