// ElectronApp imports @common but loads before ./backend registers the alias: 3.49.0 crashed at
// launch with "Cannot find module '@common/constants'". tsc keeps statement order, so this runs first.
const moduleAlias = require('module-alias')
moduleAlias.addAlias('@common', __dirname + '/backend/common')

import ElectronApp from './ElectronApp'
import headless from './backend'

headless.recapitate(new ElectronApp())
