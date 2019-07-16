require('dotenv').config()
const { notarize } = require('electron-notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename

  // See: https://github.com/electron/electron-notarize#safety-when-using-appleidpassword
  return await notarize({
    appBundleId: 'it.remote.desktop',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: 'appledeveloper@remote.it',
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  })
}
