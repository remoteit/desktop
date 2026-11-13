const fs = require('fs')

const restore = (key, value) => {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

module.exports = () => {
  const { home, HOME, USERPROFILE } = globalThis.__REMOTEIT_JEST_HOME__
  restore('HOME', HOME)
  restore('USERPROFILE', USERPROFILE)
  // Windows can't remove the log directory while an in-band run's Logger still holds combined.log open
  try {
    fs.rmSync(home, { recursive: true, force: true })
  } catch {}
}
