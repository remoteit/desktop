import createServer from './server'
import debug from 'debug'
import { app } from 'electron'

const d = debug('desktop')

createServer()

app.on('ready', () => d('Desktop application ready!'))

app.on('window-all-closed', () => {
  d('All windows closed')
  if (process.platform !== 'darwin') app.quit()
})
