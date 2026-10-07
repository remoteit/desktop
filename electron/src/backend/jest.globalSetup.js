const fs = require('fs')
const os = require('os')
const path = require('path')

// Runs in the parent before workers fork: setupFiles only see a copy of process.env, which os.homedir() ignores
module.exports = () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'remoteit-jest-home-'))
  process.env.HOME = home
  process.env.USERPROFILE = home
  process.on('exit', () => fs.rmSync(home, { recursive: true, force: true }))
}
