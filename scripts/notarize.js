require('dotenv').config()
const { notarize } = require('electron-notarize')

const RED = '\x1b[31m'
const BLUE = '\x1b[34m'
const END = '\x1b[0m'

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  const { productFilename } = context.packager.appInfo

  if (electronPlatformName !== 'darwin') return

  if (process.env.SKIP_SIGNING === 'true') {
    console.log(`  ${RED}!${END} SKIP notarizing ${BLUE}name${END}=${appOutDir}/${productFilename}`)
    return
  }

  console.log(`  ${BLUE}•${END} notarizing     ${BLUE}name${END}=${appOutDir}/${productFilename}`)

  // See: https://github.com/electron/electron-notarize#safety-when-using-appleidpassword
  return await notarize({
    appBundleId: 'it.remote.desktop',
    appPath: `${appOutDir}/${productFilename}.app`,
    appleId: 'appledeveloper@remote.it',
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  })
}
