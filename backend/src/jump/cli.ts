import { ITarget } from './common-copy/types'
import File from './file'

class Settings extends File {
  set(key: string, value: any) {
    switch (key) {
      case 'targets':
        this.handle(value)
        break

      case 'device':
        if (!this.data.device.uid && value.name) {
          this.register(value)
          console.log('REGISTER', value.name)
          this.readDevice()
        } else if (value === 'DELETE') {
          this.delete()
          console.log('DELETE', this.data.device.name)
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
      console.log('UPDATE')
    } else if (targets.length < length) {
      const target = this.diff(targets, this.data.targets)
      if (target) this.removeTarget(target)
      console.log('DELETE', target)
    } else if (targets.length > length) {
      const target = this.diff(this.data.targets, targets)
      if (target) this.addTarget(target)
      console.log('ADD', target)
    }

    this.readTargets()
  }

  diff(smaller: ITarget[], larger: ITarget[]) {
    const result = larger.find((target, index) => {
      // @FIXME might be able to check by uid
      return (
        !smaller[index] ||
        target.port !== smaller[index].port ||
        target.hostname !== smaller[index].hostname
      )
    })
    return result
  }
}

export default new Settings()
