import Logger from './Logger'
import EventBus from './EventBus'
import Command from './Command'
import environment from './environment'

const EVENTS = {
  notInstalled: 'required/app',
  onError: 'service/error/command',
  minimizeWindows: 'windows/minimize',
}

export const openCMD = async (params: { launchApp: ILaunchApp; command: string }) => {
  if (params.launchApp.path) return launchApplication(params)
  Logger.info('LAUNCH APP', { launchApp: params.launchApp })
  const commands = new Command({})
  commands.push(`${params.command}`)
  const result = await commands.exec()
  if (result) {
    try {
      if (result.includes('Command failed:')) {
        EventBus.emit(EVENTS.onError, result.toString() )
      } else if (environment.isWindows) {
        launchApplication(params)
      }
    } catch (error: any) {
      Logger.warn('OPEN APP ON WINDOWS ERROR', { result, errorMessage: error.message.toString() })
    }
  }
}

async function launchApplication(params: { launchApp: ILaunchApp; command: string }) {
  // use defaultTemplateCmd
  const commands = new Command({})
  commands.push(`${params.command}`)
  const result = await commands.exec()
  if (result) {
    try {
      const parsed = JSON.parse(result)
      return parsed.data
    } catch (error: any) {
      Logger.warn('LAUNCH APP PARSE ERROR', { result, errorMessage: error.message.toString() })
    }
  }
}

export default { EVENTS }
