// electron-builder reads either a config file or package.json's `build`, never both, so this
// spreads the branded package.json config and adds only what depends on the environment.
const { withSigning } = require('./scripts/win-signing')

module.exports = withSigning(require('./package.json').build, process.env)
