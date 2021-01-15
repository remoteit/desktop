import Logger from './Logger'
import EventBus from './EventBus'
const child_process = require('child_process')

const EVENTS = {
  notInstalled: 'required/app',
  minimizeWindows: 'windows/minimize',
}

/* 
  @FIXME - these commands should all use the Command.ts class
*/

export const openCMDforWindows = (launchApp: ILaunchApp) => {
  if (launchApp.path) return launchApplication(launchApp.path, launchApp)

  EventBus.emit(EVENTS.notInstalled, { install: 'none', loading: true })
  Logger.info('LAUNCH APP', { launchApp })
  const process = child_process.exec(`DIR /S ${launchApp.application}.exe /B`, { cwd: 'C:\\' })

  process.stdout.on('data', (data: string) => {
    Logger.info(`stdout: ${data}`)
    Logger.info(`stdout: ${data.replace(`\\${launchApp.application}.exe`, ``).replace(/\\/g, '\\\\')}`)
    const cwd = data.replace(`\\${launchApp.application}.exe`, ``).replace(/\\/g, '\\\\').trim()
    EventBus.emit(EVENTS.notInstalled, { install: 'none', loading: false, path: cwd })
    launchApplication(cwd, launchApp)
  })

  process.stderr.on('data', (data: string) => {
    Logger.info(`stderr: ${data}`)
  })

  process.on('close', (code: any) => {
    Logger.info(`child process exited with code ${code}`)
  })

  child_process.exec(
    `DIR /S ${launchApp.application}.exe /B`,
    { cwd: 'C:\\' },
    (error: any, stdout: any, stderr: any) => {
      error && Logger.error(`error: ${error}`)
      Logger.info(`RESULT ${launchApp.application}`, { stdout, stderr })
      if (!stdout.trim()) {
        EventBus.emit(EVENTS.notInstalled, { install: `${launchApp.application}`, loading: false })
      }
    }
  )
}

function launchApplication(cwd: string, launchApp: ILaunchApp) {
  let command = ''
  switch (launchApp.application) {
    case 'putty':
      command = `start ${launchApp.application}.exe -ssh ${launchApp.host} ${launchApp.port}`
      break
    case 'vncviewer':
      command = `start ${launchApp.application}.exe -Username ${launchApp.username} ${launchApp.host}:${launchApp.port}`
      break
  }
  child_process.exec(`${command}`, { cwd }, (error: any) => {
    error && Logger.error(`error: ${error}`)
  })
}

export default { EVENTS }
