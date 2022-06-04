import CLI from './CLI'
import Logger from './Logger'

class CLIInterface extends CLI {
  async set(key: string, value?: any) {
    switch (key) {
      case 'device':
        this.read()
        break

      case 'registration':
        if (value === 'DELETE') {
          await this.unregister()
          Logger.info('UNREGISTER ', this.data)
        } else {
          await this.register(value)
          Logger.info('REGISTER ' + value.name, { code: value.code })
        }
        break
    }
  }
}

export default new CLIInterface()
