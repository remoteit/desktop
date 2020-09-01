import Logger from './Logger'
import EventBus from './EventBus';
const child_process = require('child_process')

const EVENTS = {
  notInstalledPutty: 'service/putty/required',
  minimizeWindows: 'windows/minimize'
}

export const openCMDforWindows = (launchApp: string) => {

    EventBus.emit(EVENTS.notInstalledPutty, {install: false, loading: true})
    Logger.info("LAUNCH APP", {launchApp})
    const process = child_process.exec(`DIR /S putty.exe /B`,  {cwd: 'C:\\'});

    process.stdout.on('data', (data: any) => {
      Logger.info(`stdout: ${data}`)
      EventBus.emit(EVENTS.notInstalledPutty, {install: false, loading: false})
      const server = launchApp.split('//')[1].split(':')
      const command = `start putty.exe -ssh ${server[0]} ${server[1]}`
      Logger.info(`stdout: ${data.replace('\\putty.exe', '').replace(/\\/g, '\\\\')}`)
      const cwd = data.replace('\\putty.exe', '').replace(/\\/g, '\\\\').trim()
      child_process.exec(`${command}`, {cwd}, ((error: any) =>{ 
        error && Logger.error(`error: ${error}`)
      }))
    });
    
    process.stderr.on('data', (data: string) => {
      Logger.info(`stderr: ${data}`);
    });
    
    process.on('close', (code: any) => {
      Logger.info(`child process exited with code ${code}`);
    });

    child_process.exec(`wmic product where "Name like '%PuTTy%'" get Name, Version`, (error: any, stdout: any, stderr: any) => {
        error && Logger.error(`error: ${error}`)
        Logger.info(`RESULT PUTTY`, {stdout, stderr})
        if (stdout === '\r\r\n\r\r\n') {
            EventBus.emit(EVENTS.notInstalledPutty, {install: true, loading: false})
        }
    });
}

export default { EVENTS }