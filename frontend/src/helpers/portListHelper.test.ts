import { describe, expect, it } from 'vitest'
import { parsePorts } from './portListHelper'

describe('parsePorts', () => {
  it('takes ports by commas or spaces, each once, in order', () => {
    expect(parsePorts('445, 137 139,137')).toEqual([137, 139, 445])
    expect(parsePorts('')).toEqual([])
  })

  it('refuses what is not a port', () => {
    expect(parsePorts('0')).toBeUndefined()
    expect(parsePorts('65536')).toBeUndefined()
    expect(parsePorts('22, smb')).toBeUndefined()
  })
})
