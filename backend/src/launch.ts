import Logger from './Logger'
import EventBus from './EventBus';
const child_process = require('child_process')

const EVENTS = {
  notInstalledPutty: 'service/putty/required',
}

export const openCMDforWindows = (launchApp: string) => {

    EventBus.emit(EVENTS.notInstalledPutty, {install: false, loading: true})
    Logger.info("LAUNCH APP", {launchApp})
    child_process.exec(`wmic product where "Name like '%PuTTy%'" get Name, Version`, (error: any, stdout: any, stderr: any) => {
        error && Logger.error(`error: ${error}`)
        Logger.info(`RESULT PUTTY`, {stdout})
        if(stdout === '\r\r\n\r\r\n'){
            EventBus.emit(EVENTS.notInstalledPutty, {install: true, loading: false})
        } else {
            EventBus.emit(EVENTS.notInstalledPutty, {install: false, loading: false})
            const server = launchApp.split('//')[1].split(':')
            const command = `&& start putty.exe -ssh ${server[0]} ${server[1]}`
            child_process.exec(`cd "c:\\Program Files\\PuTTY" ${command}`,((error: any) =>{ 
                error && Logger.error(`error: ${error}`)
            }))
            Logger.info("NEW LINES")
            child_process.exec(`cd "c:\\Program Files (x86)\\PuTTY" ${command}`,((error: any) =>{ 
                error && Logger.error(`error: ${error}`)
            }))
        }
    });
}

export default { EVENTS }