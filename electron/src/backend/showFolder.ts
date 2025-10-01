import Command from './Command'
import environment from './environment'

class ShowFolder {
  show = (folder: IShowFolderType) => {
    let folders = {
      logs: [environment.adminPath, environment.logPath],
      connections: [environment.connectionLogPath],
    }

    if (environment.cliLogPath) folders.logs.push(environment.cliLogPath)

    const commands = new Command({})
    folders[folder].forEach(path => commands.push(this.command(path)))
    commands.exec()
  }

  command(path: string) {
    return environment.isWindows ? `start "" "${path}"` : environment.isMac ? `open ${path}` : `nautilus ${path}`
  }
}

export default new ShowFolder()
