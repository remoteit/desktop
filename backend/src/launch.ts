import Logger from './Logger'
import EventBus from './EventBus'
const child_process = require('child_process')

const EVENTS = {
  notInstalledPutty: 'service/putty/required',
  notInstalledVNC: 'service/VNC/required',
  minimizeWindows: 'windows/minimize',
}

export const openCMDforWindows = (launchApp: any) => {
  if (launchApp.pathPutty) return lunchPutty(launchApp.pathPutty, launchApp.command)

  EventBus.emit(EVENTS.notInstalledPutty, { install: false, loading: true })
  Logger.info('LAUNCH APP', { launchApp })
  const process = child_process.exec(`DIR /S putty.exe /B`, { cwd: 'C:\\' })

  process.stdout.on('data', (data: string) => {
    Logger.info(`stdout: ${data}`)
    Logger.info(`stdout: ${data.replace('\\putty.exe', '').replace(/\\/g, '\\\\')}`)
    const cwd = data.replace('\\putty.exe', '').replace(/\\/g, '\\\\').trim()

    EventBus.emit(EVENTS.notInstalledPutty, { install: false, loading: false, pathPutty: cwd })

    lunchPutty(cwd, launchApp.command)
  })

  process.stderr.on('data', (data: string) => {
    Logger.info(`stderr: ${data}`)
  })

  process.on('close', (code: any) => {
    Logger.info(`child process exited with code ${code}`)
  })

  child_process.exec(`DIR /S putty.exe /B`, { cwd: 'C:\\' }, (error: any, stdout: any, stderr: any) => {
    error && Logger.error(`error: ${error}`)
    Logger.info(`RESULT PUTTY`, { stdout, stderr })
    if (!stdout.trim()) {
      EventBus.emit(EVENTS.notInstalledPutty, { install: true, loading: false })
    }
  })
}

export const openCMDvnc = (launchApp: any) => {
  if (launchApp.pathVNC) return launchVNC(launchApp.pathVNC, launchApp.port, launchApp.host, launchApp.username)
  EventBus.emit(EVENTS.notInstalledVNC, { install: false, loading: true })
  Logger.info('LAUNCH APP', { launchApp })
  const process = child_process.exec(`DIR /S vncviewer.exe /B`, { cwd: 'C:\\' })

  process.stdout.on('data', (data: string) => {
    Logger.info(`stdout: ${data}`)
    Logger.info(`stdout: ${data.replace('\\vncviewer.exe', '').replace(/\\/g, '\\\\')}`)
    const cwd = data.replace('\\vncviewer.exe', '').replace(/\\/g, '\\\\').trim()
    EventBus.emit(EVENTS.notInstalledVNC, { install: false, loading: false, pathVNC: cwd })
    launchVNC(cwd, launchApp.port, launchApp.host, launchApp.username)
  })

  process.stderr.on('data', (data: string) => {
    Logger.info(`stderr: ${data}`)
  })

  process.on('close', (code: any) => {
    Logger.info(`child process exited with code ${code}`)
  })

  child_process.exec(`DIR /S vncviewer.exe /B`, { cwd: 'C:\\' }, (error: any, stdout: any, stderr: any) => {
    error && Logger.error(`error: ${error}`)
    Logger.info(`RESULT VNC VIEWER`, { stdout, stderr })
    if (!stdout.trim()) {
      EventBus.emit(EVENTS.notInstalledVNC, { install: true, loading: false })
    }
  })
}

function lunchPutty(cwd: string, launchApp: string) {
  const server = launchApp.split('//')[1].split(':')
  const command = `start putty.exe -ssh ${server[0]} ${server[1]}`
  child_process.exec(`${command}`, { cwd }, (error: any) => {
    error && Logger.error(`error: ${error}`)
  })
}

function launchVNC(cwd: string, port: string, host: string, username: string) {
  const command = `start vncviewer.exe -Username ${username} ${host}:${port}`
  Logger.info('COMMAND VNC', { command })
  child_process.exec(`${command}`, { cwd }, (error: any) => {
    error && Logger.error(`error: ${error}`)
  })
}

export default { EVENTS }
