import * as binary from './binary'
import * as platform from './platform'
// import * as release from './release'
// import * as update from './update'
import { install } from './install'
import { LATEST_CONNECTD_RELEASE } from '../constants'

async function run() {
  console.log()
  console.log('Binary name:', platform.binaryName())
  console.log('Path:', platform.targetPath())
  console.log('Exists?', binary.exists())
  // if (ConnectdBinary.exists) {
  console.log('Local version:', binary.version())
  // console.log('Latest version:', await release.latestVersion())
  // const needsUpdate = await update.needsUpdate()
  // console.log('Needs update?', needsUpdate)
  // if (needsUpdate) {
  // Prompt user for update...
  await install(LATEST_CONNECTD_RELEASE, percent =>
    console.log(`Progress: ${toPercent(percent)}%`)
  )
  console.log('Installed latest version of connectd!')
  // }
  // }
}

run()

function toPercent(percent: number) {
  return Math.floor(percent * 100)
}
