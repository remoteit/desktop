const fs = require('fs')
const os = require('os')
const path = require('path')

// Runs in the parent before workers fork: setupFiles only see a copy of process.env, which os.homedir() ignores
module.exports = () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'remoteit-jest-home-'))
  globalThis.__REMOTEIT_JEST_HOME__ = { home, HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE }
  process.env.HOME = home
  process.env.USERPROFILE = home
}
