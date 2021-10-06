import Logger from './Logger'
import EventBus from './EventBus'
import Command from './Command'
import { Application } from './sharedCopy/applications'

const EVENTS = {
  notInstalled: 'required/app',
  minimizeWindows: 'windows/minimize',
}

export const openCMDforWindows = async (params: { launchApp: ILaunchApp, app: Application }) => {
  if (params.launchApp.path) return launchApplication(params)
  Logger.info('LAUNCH APP', { launchApp: params.launchApp })
  const commands = new Command({})
  commands.push(`${params.app.defaultTemplateCmd}`)
  const result = await commands.exec()
  if (result) {
    try {
      if (result.includes('Command failed:')) {
        EventBus.emit(EVENTS.notInstalled, { install: `${params.launchApp.application}`, loading: false })
      } else {
        launchApplication(params)
      }
    } catch (error) {
      Logger.warn('OPEN APP ON WINDOWS ERROR', { result, errorMessage: error.message.toString() })
    }
  }
}

export const checkAppForWindows = async (params: { application: string, cmd: string }) => {
  const commands = new Command({})
  commands.push(`${params.cmd}`)
  const result = await commands.exec()
  Logger.info('CHECK APP EXISTS: ', { result })
  if (result.includes('Command failed:')) {
    EventBus.emit(EVENTS.notInstalled, { install: `${params.application}`, loading: false })
  } else {
    EventBus.emit(EVENTS.notInstalled, { install: `none`, loading: false })
  }
}

async function launchApplication(params: { launchApp: ILaunchApp, app: Application }) {
  // use defaultTemplateCmd
  const commands = new Command({})
  commands.push(params.app.defaultTemplateCmd)
  const result = await commands.exec()
  if (result) {
    try {
      const parsed = JSON.parse(result)
      return parsed.data
    } catch (error) {
      Logger.warn('LAUNCH APP PARSE ERROR', { result, errorMessage: error.message.toString() })
    }
  }
}

export default { EVENTS }