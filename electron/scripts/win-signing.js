// Windows signer selection, shared by electron-builder.config.js and verify-win-installers.js.
// See RELEASE.md, "Windows code signing".

const { parseDn } = require('builder-util-runtime')

// CN of the SSL.com certificate; desktop <= 3.13.4 accepts an update only from exactly this name.
const LEGACY_PUBLISHER = 'remot3.it, Inc.'

const AZURE_VARS = {
  endpoint: 'AZURE_SIGN_ENDPOINT',
  codeSigningAccountName: 'AZURE_SIGN_ACCOUNT',
  certificateProfileName: 'AZURE_SIGN_PROFILE',
  publisherName: 'AZURE_SIGN_PUBLISHER',
}

function azureSignOptions(env) {
  const given = Object.entries(AZURE_VARS).filter(([, name]) => env[name])
  if (given.length === 0) return null
  const missing = Object.values(AZURE_VARS).filter(name => !env[name])
  if (missing.length) throw new Error(`Azure signing is configured but ${missing.join(', ')} not set`)
  return {
    ...Object.fromEntries(given.map(([key, name]) => [key, env[name]])),
    fileDigest: 'SHA256',
    timestampRfc3161: 'http://timestamp.acs.microsoft.com',
    timestampDigest: 'SHA256',
  }
}

/** 'skip' | 'azure' | 'signtool' */
function signingMode(env) {
  if (env.SKIP_SIGNING === 'true') return 'skip'
  return azureSignOptions(env) ? 'azure' : 'signtool'
}

/** Publisher names a build under `env` must be signed by. */
function expectedPublishers(env) {
  const azure = azureSignOptions(env)
  return azure ? [azure.publisherName, LEGACY_PUBLISHER] : [LEGACY_PUBLISHER]
}

// electron-updater's rule (windowsExecutableCodeSignatureVerifier): a full DN matches when every
// attribute it names equals the signer's; a bare name matches the signer's CN.
function publisherMatches(subject, names) {
  const signer = parseDn(subject || '')
  return names.some(name => {
    const dn = parseDn(name)
    return dn.size ? [...dn].every(([key, value]) => signer.get(key) === value) : name === signer.get('CN')
  })
}

/** The electron-builder config for this build; `base` is package.json's `build` after branding. */
function withSigning(base, env) {
  const { signtoolOptions, ...win } = base.win
  switch (signingMode(env)) {
    case 'skip':
      return { ...base, win }
    case 'azure': {
      const azure = azureSignOptions(env)
      return {
        ...base,
        forceCodeSigning: true,
        win: { ...win, azureSignOptions: azure },
        // Lands in app-update.yml as the list an installed app verifies its NEXT update against. The
        // SSL.com name stays until that certificate is retired so a hotfix signed with it still installs.
        publish: { provider: 'github', publisherName: [azure.publisherName, LEGACY_PUBLISHER] },
      }
    }
    default:
      return { ...base, forceCodeSigning: true, win: { ...win, signtoolOptions } }
  }
}

module.exports = { LEGACY_PUBLISHER, signingMode, expectedPublishers, publisherMatches, withSigning }
