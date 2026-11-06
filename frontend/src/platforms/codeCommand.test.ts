import { beforeAll, describe, expect, it } from 'vitest'
import { platforms } from '.'

beforeAll(() => platforms.initialize(), 30_000)

// A one-time code has no command from graphql: the client renders one only from a platform's own catalogue template.
describe('codeCommand', () => {
  it("substitutes the code into a platform's own template, as the registration page does", () => {
    expect(platforms.codeCommand(1219, 'ABC-123')).toBe(
      'docker run -d -e R3_REGISTRATION_CODE="ABC-123" --restart unless-stopped --pull always remoteit/remoteit-agent:latest'
    )
  })

  it('is the code alone for a platform that takes just the code', () => {
    expect(platforms.codeCommand(1213, 'ABC-123')).toBe('ABC-123')
  })

  it("renders nothing where the command is graphql's generic installer, or no platform is known", () => {
    expect(platforms.codeCommand(769, 'ABC-123')).toBeUndefined()
    expect(platforms.codeCommand(undefined, 'ABC-123')).toBeUndefined()
  })
})
