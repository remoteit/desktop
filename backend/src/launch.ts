import Logger from './Logger'
import EventBus from './EventBus';
import Installer from './Installer';
const child_process = require('child_process')

export const openCMDforWindows = (launchApp: string) => {

    child_process.exec(`wmic product where "Name like '%PuTTy%'" get Name, Version`, (error: any, stdout: any, stderr: any) => {
        error && Logger.error(`error: ${error}`)
        if(stdout === '\r\r\n\r\r\n'){
            EventBus.emit(Installer.EVENTS.notInstalledPutty)
        } else {
            Logger.info(`stdout: ${stdout}`)
            child_process.exec(`cd "c:\\Program Files\\PuTTY" && start putty.exe ${launchApp}`,((error: any) =>{
                error && Logger.error(`error: ${error}`)
            }))
            
        }
    });
}