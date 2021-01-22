import Command from './Command'
import environment from './environment'

class ShowFolder {
  show = (folder: IShowFolderType) => {
    const folders = {
      logs: [environment.adminPath, environment.logPath],
      connections: [environment.connectionLogPath],
    }

    const commands = new Command({})
    folders[folder].forEach(path => commands.push(this.command(path)))
    commands.exec()
  }

  command(path: string) {
    return environment.isWindows ? `start "" "${path}"` : environment.isMac ? `open ${path}` : `nautilus ${path}`
  }
}

export default new ShowFolder()
