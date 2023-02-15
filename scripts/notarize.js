require('dotenv').config()
const { notarize } = require('electron-notarize')

exports.default = async function notarizing(context) {
  const { appOutDir } = context
  const { productFilename } = context.packager.appInfo

  if (process.env.SKIP_SIGNING === 'true') {
    console.log(`  ! SKIP notarizing      name=${appOutDir}/${productFilename}`)
    return
  }

  console.log(`  • notarizing      name=${appOutDir}/${productFilename}`)

  // See: https://github.com/electron/electron-notarize#safety-when-using-appleidpassword
  return await notarize({
    appBundleId: 'it.remote.desktop',
    appPath: `${appOutDir}/${productFilename}.app`,
    appleId: 'appledeveloper@remote.it',
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  })
}
