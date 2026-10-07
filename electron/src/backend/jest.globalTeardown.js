const fs = require('fs')

module.exports = () => fs.rmSync(globalThis.__REMOTEIT_JEST_HOME__, { recursive: true, force: true })
