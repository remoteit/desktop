import File from './File'
import Logger from './Logger'

class CLIInterface extends File {
  set(key: string, value: any) {
    switch (key) {
      case 'targets':
        this.handle(value)
        break

      case 'device':
        if (!this.data.device.uid && value.name) {
          this.register(value)
          Logger.info('REGISTER ' + value.name)
          this.readDevice()
        } else if (value === 'DELETE') {
          this.delete()
          Logger.info('DELETE ' + this.data.device.name)
          this.readDevice()
        }
        break
    }
  }

  handle(targets: ITarget[]) {
    const { length } = this.data.targets

    if (targets.length === length) {
      // @FIXME not currently supported by cli
      this.write('targets', targets)
      Logger.info('UPDATE', targets)
    } else if (targets.length < length) {
      const target = this.diff(targets, this.data.targets)
      if (target) this.removeTarget(target)
      Logger.info('DELETE', target)
    } else if (targets.length > length) {
      const target = this.diff(this.data.targets, targets)
      if (target) this.addTarget(target)
      Logger.info('ADD', target)
    }

    this.readTargets()
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
