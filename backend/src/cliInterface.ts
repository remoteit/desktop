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
        } else if (value.name && value.name !== this.data.device.name) {
          await this.setDevice(value)
          Logger.info('MODIFY DEVICE' + this.data.device.name)
        } else if (value === 'DELETE') {
          await this.unregister()
          Logger.info('DELETE DEVICE ' + this.data.device.name)
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
      const target = this.modified(targets, this.data.targets)
      if (target) {
        await this.setTarget(target)
        Logger.warn('UPDATE TARGET', target)
      }
    } else if (targets.length < length) {
      const target = this.diff(targets, this.data.targets)
      if (target) {
        await this.removeTarget(target)
        Logger.info('DELETE TARGET', target)
      }
    } else if (targets.length > length) {
      const target = this.diff(this.data.targets, targets)
      if (target) {
        await this.addTarget(target)
        Logger.info('ADD TARGET', target)
      }
    }
  }

  modified(updated: ITarget[], current: ITarget[]) {
    return updated.find((target, index) => {
      const c = current[index]
      return (
        target.disabled !== c.disabled ||
        target.port !== c.port ||
        target.hostname !== c.hostname ||
        target.name !== c.name ||
        target.type !== c.type
      )
    })
  }

  diff(smaller: ITarget[], larger: ITarget[]) {
    const result = larger.find((target, index) => {
      return !smaller[index] || target.port !== smaller[index].port || target.hostname !== smaller[index].hostname
    })
    return result
  }
}

export default new CLIInterface()
