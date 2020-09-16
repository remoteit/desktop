import Command from './Command'
import environment from './environment'
import { LOG_DIR } from './Logger'

class ShowFolder {
  openLogs = () => {
    const commands = new Command({})
    commands.push(this.open(environment.adminPath))
    commands.push(this.open(LOG_DIR))
    commands.exec()
  }

  open(path: string) {
    return environment.isWindows ? `start "" "${path}"` : `open ${path}`
  }
}

export default new ShowFolder()
