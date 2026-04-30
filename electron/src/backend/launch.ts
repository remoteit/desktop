import path from 'path'
import Logger from './Logger'
import cli from './cliInterface'
import EventBus from './EventBus'
import Command from './Command'
import environment from './environment'

export const WINDOWS_32_BIT_OPENSSH = '%WINDIR%\\Sysnative\\OpenSSH\\ssh.exe'

export function resolveWindowsTerminalCommand(command: string, isWindows32 = environment.isWindows32) {
  if (!isWindows32) return command

  return command.replace(/^\s*ssh(?:\.exe)?(?=\s|$)/i, match => {
    const leadingWhitespace = match.match(/^\s*/)?.[0] || ''
    return `${leadingWhitespace}${WINDOWS_32_BIT_OPENSSH}`
  })
}

export function buildWindowsTerminalCommand(command: string, isWindows32 = environment.isWindows32) {
  const terminalCommand = command.replace(/^start cmd \/k\s*/i, '')
  return `start cmd /k ${resolveWindowsTerminalCommand(terminalCommand, isWindows32)}`
}

export default async function launch(command: string, type: 'TERMINAL' | 'SCRIPT' | 'COMMAND' = 'COMMAND') {
  Logger.info('LAUNCH', { type, path: __filename })
  let scriptPath = ''

  if (type === 'TERMINAL') {
    if (environment.isMac) {
      command = `osascript -e 'tell application "Terminal" to do script "${command
        .replace(/"/g, '\\"')
        .replace(/\\/g, '\\')}" activate'`
    } else if (environment.isLinux) {
      command = `gnome-terminal -- /bin/bash -c '${command}; read'`
    } else {
      command = buildWindowsTerminalCommand(command)
    }
  }

  if (type === 'SCRIPT') {
    const [script, ...rest] = command.split(' ')
    scriptPath = environment.isDev
      ? path.resolve(__dirname, '../scripts/', script)
      : path.resolve(environment.binPath, script)
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
    let message = e.toString()
    if (message.includes('[CATransaction synchronize]')) return
    if (type === 'SCRIPT')
      message = `SCRIPT FAILED. Please check anti-virus software and file permissions for "${scriptPath}".`
    EventBus.emit(cli.EVENTS.error, message)
  }

  const result = await commands.exec()

  if (result && result.includes('Command failed:')) {
    EventBus.emit(cli.EVENTS.error, result.toString())
    Logger.warn('LAUNCH APP COMMAND FAILURE')
  }

  Logger.info('LAUNCH RESULT', { result })
}
