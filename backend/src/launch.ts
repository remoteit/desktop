import Logger from './Logger'
import EventBus from './EventBus';
const child_process = require('child_process')

const EVENTS = {
  notInstalledPutty: 'service/putty/required',
}

export const openCMDforWindows = (launchApp: string) => {

    EventBus.emit(EVENTS.notInstalledPutty, {install: false, loading: true})
    child_process.exec(`wmic product where "Name like '%PuTTy%'" get Name, Version`, (error: any, stdout: any, stderr: any) => {
        error && Logger.error(`error: ${error}`)
        Logger.info(`RESULT PUTTY`, {stdout})
        if(stdout === '\r\r\n\r\r\n'){
            EventBus.emit(EVENTS.notInstalledPutty, {install: true, loading: false})
        } else {
            EventBus.emit(EVENTS.notInstalledPutty, {install: false, loading: false})
            child_process.exec(`cd "c:\\Program Files\\PuTTY" && start putty.exe ${launchApp}`,((error: any) =>{
                error && Logger.error(`error: ${error}`)
            }))
            child_process.exec(`cd "c:\\Program Files (x86)\\PuTTY" && start putty.exe ${launchApp}`,((error: any) =>{
                error && Logger.error(`error: ${error}`)
            }))
        }
    });
}

export default { EVENTS }