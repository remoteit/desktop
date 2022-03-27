import Logger from './Logger'
import cli from './cliInterface'
import EventBus from './EventBus'
import Command from './Command'
import environment from './environment'

export default async function launch(command: string, terminal: boolean) {
  Logger.info('LAUNCH', { command, terminal })

  if (terminal) {
    if (environment.isMac) {
      command = `osascript -e 'tell application "Terminal" to do script "${command
        .replace(/"/g, '\\"')
        .replace(/\\/g, '\\\\')}" activate'`
    } else if (environment.isLinux) {
      command = `gnome-terminal -- /bin/bash -c '${command}; read'`
    }
  }

  const commands = new Command({ command })
  commands.onError = (e: Error) => EventBus.emit(cli.EVENTS.error, e.toString())
  const result = await commands.exec()

  if (result && result.includes('Command failed:')) {
    EventBus.emit(cli.EVENTS.error, result.toString())
    Logger.warn('LAUNCH APP ERROR', { result })
  }
}
