import { app, BrowserWindow } from 'electron'
import server from './server'
import { PORT } from './constants'
import debug from 'debug'

const d = debug('desktop')

server.listen(PORT, () => d(`Listening on ${PORT}`))

app.on('ready', () => d('Desktop application ready!'))

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
