export interface IPlatform {
  id: string
  name: string
  hidden?: boolean
  subtitle?: string
  component: (props: any) => React.ReactElement
  types?: INumberLookup<string>
  services?: IServiceRegistration[]
  hasScreenView?: boolean
  installation?: {
    label?: string
    download?: boolean
    command?: boolean | string
    instructions?: string | React.ReactNode
    qualifier: string
    link?: string
    altLink?: string
  }
}

class Platforms {
  platforms: ILookup<IPlatform> = {}
  lookup: INumberLookup<string> = {}
  nameLookup: INumberLookup<string> = {}
  installed: string[] = [
    'advantech',
    'alpine',
    'android',
    'android-screenview',
    'arm',
    'aws',
    'axis',
    'azure',
    'docker',
    'docker-extension',
    'docker-jumpbox',
    'firewalla',
    'gcp',
    'ios',
    'linux',
    'mac',
    'nas',
    'nvidia',
    'openwrt',
    'raspberrypi',
    'remoteit',
    'this',
    'tinkerboard',
    'ubiquiti',
    'ubuntu',
    'unknown',
    'windows',
  ]

  constructor() {
    this.initialize()
  }

  initialize() {
    this.installed.forEach(async platform => await import(`./${platform}/index.tsx`))
  }

  register(platform: IPlatform) {
    platform.types = platform.types || {}
    platform.hasScreenView = platform.services?.some(s => s.application === 48)
    this.platforms[platform.id] = platform
    Object.keys(platform.types).forEach(type => {
      if (platform.hidden) return
      this.lookup[type] = platform.id
      this.nameLookup[type] = platform.types?.[type]
    })
  }

  type(type: number): IPlatform {
    return this.get(this.lookup[type] || 'unknown')
  }

  get(id: string = 'unknown'): IPlatform {
    return this.platforms[id] || {}
  }

  findType(id?: string): number | undefined {
    const typeIds = Object.keys(this.get(id).types || {})
    return Number(typeIds[0])
  }

  component(id?: string): IPlatform['component'] {
    return this.get(id).component || (() => null)
  }

  componentByType(type: number): IPlatform['component'] {
    return this.component(this.type(type).id)
  }
}

export const platforms = new Platforms()
