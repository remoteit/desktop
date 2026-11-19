// electron-builder loads electron-builder.env, not the .env that sign.js reads; without this a local
// SKIP_SIGNING=true build would be configured to sign while the hook skips.
require('dotenv').config()
// electron-builder reads either a config file or package.json's `build`, never both, so this
// spreads the branded package.json config and adds only what depends on the environment.
const { withSigning } = require('./scripts/win-signing')
const { withAirbrake } = require('./scripts/airbrake')

module.exports = withAirbrake(withSigning(require('./package.json').build, process.env), process.env)
