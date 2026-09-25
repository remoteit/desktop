// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  LEGACY_PUBLISHER,
  signingMode,
  expectedPublishers,
  publisherMatches,
  withSigning,
} = require('../../scripts/win-signing')

const SSL_SUBJECT =
  'CN="remot3.it, Inc.", O="remot3.it, Inc.", L=Palo Alto, S=California, C=US, SERIALNUMBER=4797542, OID.2.5.4.15=Private Organization'
const AZURE_PUBLISHER = 'CN="remot3.it, Inc.", O="remot3.it, Inc.", L=Palo Alto, S=California, C=US'
const AZURE = {
  AZURE_SIGN_ENDPOINT: 'https://wus2.codesigning.azure.net',
  AZURE_SIGN_ACCOUNT: 'remoteit',
  AZURE_SIGN_PROFILE: 'remoteit-public',
  AZURE_SIGN_PUBLISHER: AZURE_PUBLISHER,
}
const BASE = {
  productName: 'Remote.It',
  win: { signtoolOptions: { sign: './scripts/sign.js', signingHashAlgorithms: ['sha256'] }, target: ['nsis'] },
}

describe('signingMode', () => {
  test('skip wins over everything', () => {
    expect(signingMode({ SKIP_SIGNING: 'true', ...AZURE })).toBe('skip')
  })

  test('azure when all four variables are set, signtool when none are', () => {
    expect(signingMode(AZURE)).toBe('azure')
    expect(signingMode({})).toBe('signtool')
    expect(signingMode({ SKIP_SIGNING: 'false' })).toBe('signtool')
  })

  test('a partial Azure configuration is an error, not a silent fallback', () => {
    const { AZURE_SIGN_PUBLISHER, ...partial } = AZURE
    expect(() => signingMode(partial)).toThrow('AZURE_SIGN_PUBLISHER')
  })
})

describe('withSigning', () => {
  test('skip removes the signing hook and does not force signing', () => {
    const config = withSigning(BASE, { SKIP_SIGNING: 'true' })
    expect(config.win.signtoolOptions).toBeUndefined()
    expect(config.win.azureSignOptions).toBeUndefined()
    expect(config.forceCodeSigning).toBeUndefined()
    expect(config.win.target).toEqual(['nsis'])
  })

  test('signtool keeps the hook and forces signing', () => {
    const config = withSigning(BASE, {})
    expect(config.win.signtoolOptions).toEqual(BASE.win.signtoolOptions)
    expect(config.forceCodeSigning).toBe(true)
    expect(config.publish).toBeUndefined()
  })

  test('azure replaces the hook, forces signing and lists both publishers, new one first', () => {
    const config = withSigning(BASE, AZURE)
    expect(config.win.signtoolOptions).toBeUndefined()
    expect(config.win.azureSignOptions).toEqual({
      endpoint: AZURE.AZURE_SIGN_ENDPOINT,
      codeSigningAccountName: 'remoteit',
      certificateProfileName: 'remoteit-public',
      publisherName: AZURE_PUBLISHER,
      fileDigest: 'SHA256',
      timestampRfc3161: 'http://timestamp.acs.microsoft.com',
      timestampDigest: 'SHA256',
    })
    expect(config.forceCodeSigning).toBe(true)
    expect(config.publish).toEqual({ provider: 'github', publisherName: [AZURE_PUBLISHER, LEGACY_PUBLISHER] })
    expect(config.productName).toBe('Remote.It')
  })
})

describe('expectedPublishers', () => {
  test('the SSL.com name alone, or the Azure subject first', () => {
    expect(expectedPublishers({})).toEqual([LEGACY_PUBLISHER])
    expect(expectedPublishers(AZURE)).toEqual([AZURE_PUBLISHER, LEGACY_PUBLISHER])
  })
})

describe('publisherMatches', () => {
  test('a bare name matches the CN only', () => {
    expect(publisherMatches(SSL_SUBJECT, ['remot3.it, Inc.'])).toBe(true)
    expect(publisherMatches(SSL_SUBJECT, ['remot3.it, Inc'])).toBe(false)
    expect(publisherMatches(SSL_SUBJECT, ['Remot3.it, Inc.'])).toBe(false)
  })

  test('a distinguished name must agree on every attribute it lists', () => {
    expect(publisherMatches(SSL_SUBJECT, [AZURE_PUBLISHER])).toBe(true)
    expect(publisherMatches(SSL_SUBJECT, ['CN="remot3.it, Inc.", L=Houston'])).toBe(false)
    expect(publisherMatches(SSL_SUBJECT, ['CN="remot3.it, Inc.", OU=Desktop'])).toBe(false)
  })

  test('any listed publisher is enough, and no subject matches nothing', () => {
    expect(publisherMatches(SSL_SUBJECT, ['CN=Someone Else', LEGACY_PUBLISHER])).toBe(true)
    expect(publisherMatches(undefined, [LEGACY_PUBLISHER])).toBe(false)
    expect(publisherMatches(SSL_SUBJECT, [])).toBe(false)
  })
})
