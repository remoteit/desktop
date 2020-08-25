import Logger from './Logger'
const child_process = require('child_process')

export const openCMDforWindows = (launchApp: string) => {
    Logger.error(launchApp)
    child_process.exec(`start cmd.exe /K ${launchApp}`)
}