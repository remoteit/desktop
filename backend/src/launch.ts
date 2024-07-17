import path from 'path'
import Logger from './Logger'
import cli from './cliInterface'
import EventBus from './EventBus'
import Command from './Command'
import environment from './environment'

export default async function launch(command: string, type: 'TERMINAL' | 'SCRIPT' | 'COMMAND' = 'COMMAND') {
  Logger.info('LAUNCH', { type, path: __filename })

  if (type === 'TERMINAL') {
    if (environment.isMac) {
      command = `osascript -e 'tell application "Terminal" to do script "${command
        .replace(/"/g, '\\"')
        .replace(/\\/g, '\\')}" activate'`
    } else if (environment.isLinux) {
      command = `gnome-terminal -- /bin/bash -c '${command}; read'`
    } else {
      command = `start cmd /k ${command.replace('start cmd /k', '')}`
    }
  }

  if (type === 'SCRIPT') {
    const [script, ...rest] = command.split(' ')
    const scriptPath = path.resolve(__dirname, '../scripts/', script)
    command = rest.join(' ')
    if (environment.isWindows) {
      command = `powershell -ExecutionPolicy Bypass -NoProfile -File "${scriptPath}" ${command}`
    } else {
      command = `${scriptPath} ${command}`
    }
    Logger.info('SCRIPT', { script, scriptPath, command })
  }

  const commands = new Command({ command })
  commands.onError = (e: Error) => {
    Logger.error('LAUNCH APP ERROR', e)
    if (e.toString().includes('[CATransaction synchronize]')) return
    EventBus.emit(cli.EVENTS.error, e.toString())
  }

  const result = await commands.exec()

  if (result && result.includes('Command failed:')) {
    EventBus.emit(cli.EVENTS.error, result.toString())
    Logger.warn('LAUNCH APP COMMAND FAILURE')
  }

  Logger.info('LAUNCH RESULT', { result })
}
