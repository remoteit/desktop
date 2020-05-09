import CLI from './CLI'
import Logger from './Logger'

class CLIInterface extends CLI {
  async set(key: string, value: any) {
    switch (key) {
      case 'targets':
        await this.handle(value)
        break

      case 'device':
        if (!value) {
          this.read()
        } else if (!this.data.device.uid && value.name) {
          await this.register(value)
          Logger.info('REGISTER ' + value.name)
        } else if (value === 'DELETE') {
          await this.delete()
          Logger.info('DELETE ' + this.data.device.name)
        }
        break

      case 'registration':
        await this.registerAll(value)
        Logger.info('REGISTER ' + value.device.name, { targets: value.targets })
        break
    }
  }

  async handle(targets: ITarget[]) {
    const { length } = this.data.targets

    if (targets.length === length) {
      // @FIXME not currently supported by cli
      Logger.warn('UPDATE', targets)
    } else if (targets.length < length) {
      const target = this.diff(targets, this.data.targets)
      if (target) {
        await this.removeTarget(target)
        Logger.info('DELETE', target)
      }
    } else if (targets.length > length) {
      const target = this.diff(this.data.targets, targets)
      if (target) {
        await this.addTarget(target)
        Logger.info('ADD', target)
      }
    }
  }

  diff(smaller: ITarget[], larger: ITarget[]) {
    const result = larger.find((target, index) => {
      // @FIXME might be able to check by uid
      return !smaller[index] || target.port !== smaller[index].port || target.hostname !== smaller[index].hostname
    })
    return result
  }
}

export default new CLIInterface()
