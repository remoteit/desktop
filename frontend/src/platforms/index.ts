// import {TARGET_PLATFORMS} from '../helpers/platformHelper'

export interface IPlatform {
  id: string
  name: string
  component: (props: any) => React.ReactElement
  types?: INumberLookup<string>
  services?: IServiceRegistration[]
  installation?: {
    command?: boolean
    instructions?: string
    qualifier: string
    link: string
  }
}

class Platforms {
  platforms: ILookup<IPlatform> = {}
  lookup: INumberLookup<string> = {}
  installed: string[] = [
    'advantech',
    'apple',
    'aws',
    'axis',
    'azure',
    'gcp',
    'linux',
    'nas',
    'nvidia',
    'openwrt',
    'raspberrypi',
    'remoteit',
    'this',
    'tinkerboard',
    'ubuntu',
    'unknown',
    'windows',
  ]

  constructor() {
    this.initialize()
  }

  initialize() {
    this.installed.forEach(async platform => await import(`./${platform}`))
  }

  register(platform: IPlatform) {
    platform.types = platform.types || {}
    this.platforms[platform.id] = platform
    Object.keys(platform.types).forEach(type => (this.lookup[type] = platform.id))
    console.log('REGISTER PLATFORM', platform.id)
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
