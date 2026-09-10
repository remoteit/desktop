import { CATALOGUE, CatalogueInstallation } from './catalogue'

export interface IPlatform {
  id: string
  name: string
  hidden?: boolean
  subtitle?: string
  component?: (props: any) => React.ReactElement
  types?: INumberLookup<string>
  services?: IServiceRegistration[]
  listItemTitle?: React.ReactNode
  route?: string
  hasScreenView?: boolean
  override?: React.FC<IPlatformOverrideProps>
  installation?: {
    label?: string
    download?: boolean
    command?: boolean | string
    instructions?: string | React.ReactNode
    description?: string
    link?: string
    oemGuide?: boolean
    addThisDevice?: boolean
  }
}

// What a platforms/<id>/index.tsx registers; see ./README.md.
export type IPlatformLocal = Partial<IPlatform> & Pick<IPlatform, 'id'>

export interface IPlatformOverrideProps {
  platform: IPlatform
  serviceTypes: number[]
  tags?: string[]
  oneTimeUse?: boolean
}

function defined<T extends object>(value?: T): Partial<T> {
  return value ? (Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>) : {}
}

class Platforms {
  platforms: ILookup<IPlatform> = {}
  lookup: INumberLookup<string> = {}
  nameLookup: INumberLookup<string> = {}
  installed: string[] = [
    'advantech',
    'alpine',
    'amnimo',
    'android-screenview',
    'android',
    'arm',
    'aws',
    'axis',
    'azure',
    'cachengo',
    'docker-extension',
    'docker-jumpbox',
    'docker',
    'embedded-works',
    'firewalla',
    'gcp',
    'idy',
    'ios',
    'linux',
    'liverock',
    'mac',
    'nas',
    'nvidia',
    'openwrt',
    'raspberrypi',
    'remoteit',
    'teltonika',
    'this',
    'tinkerboard',
    'toa',
    'ubiquiti',
    'ubuntu',
    'unknown',
    'windows',
  ]

  constructor() {
    this.seedFromCatalogue()
    this.initialize()
  }

  private seedFromCatalogue() {
    for (const [typeId, label] of Object.entries(CATALOGUE.types)) {
      this.nameLookup[Number(typeId)] = label
    }
    for (const id of Object.keys(CATALOGUE.installations)) {
      if (!this.installed.includes(id)) this.register({ id })
    }
  }

  async initialize() {
    for (const platform of this.installed) {
      await import(`./${platform}/index.tsx`)
    }
  }

  private fromCatalogue(data: CatalogueInstallation): Pick<IPlatform, 'name' | 'types' | 'services' | 'installation'> {
    const types: INumberLookup<string> = {}
    for (const [typeId, label] of Object.entries(data.types)) types[Number(typeId)] = label
    const installation: NonNullable<IPlatform['installation']> = {
      // '[CODE]' and a template are substituted client-side; `true` shows the API's command.
      command: data.kind === 'command' ? data.commandTemplate ?? true : data.kind === 'code' ? '[CODE]' : undefined,
      // A code row WITH a link is a download too: install the app, the code is the fallback.
      download: data.kind === 'download' || (data.kind === 'code' && !!data.link) || undefined,
      description: data.description,
      instructions: data.instructions,
      link: data.link,
    }
    const hasInstallation = Object.values(installation).some(value => value !== undefined)
    return { name: data.name, types, services: data.services, installation: hasInstallation ? installation : undefined }
  }

  register(local: IPlatformLocal) {
    const data = CATALOGUE.installations[local.id]
    const base: IPlatform = { name: local.id, ...local }
    if (!data && !local.hidden && !local.types && import.meta.env?.DEV) {
      console.warn(
        `platforms: "${local.id}" has no catalogue row and supplies no types — regenerate the snapshot (npm run platforms:generate)`
      )
    }
    const catalogue = data && this.fromCatalogue(data)
    const platform: IPlatform = catalogue
      ? {
          ...base,
          ...defined(catalogue),
          ...defined(local),
          installation: { ...catalogue.installation, ...defined(local.installation) },
        }
      : base
    platform.types = platform.types || {}
    platform.hasScreenView = platform.services?.some(s => s.application === 48)
    this.platforms[platform.id] = platform
    Object.keys(platform.types).forEach(type => {
      if (platform.hidden) return
      // Several pages can onboard one type; its devices render as the default, not the last one.
      const routes = CATALOGUE.routes[type]
      if (routes && routes[0] !== platform.id) return
      this.lookup[type] = platform.id
      this.nameLookup[type] = platform.types?.[type]
    })
  }

  // For a picker a user chooses from; nameLookup is wider. See ./README.md.
  get pageTypes(): INumberLookup<string> {
    return Object.fromEntries(Object.keys(this.lookup).map(type => [type, this.nameLookup[type]]))
  }

  type(type: number): IPlatform {
    return this.get(this.lookup[type])
  }

  // A page covers several types, so the type's own label beats the page name: 10 is
  // "Windows Server", not "Windows". A type with no page still has a label.
  name(type: number): string {
    return this.nameLookup[type] || this.type(type).name
  }

  get(id: string = 'unknown'): IPlatform {
    return this.platforms[id] || {}
  }

  findType(id?: string): number | undefined {
    const typeIds = Object.keys(this.get(id).types || {})
    return Number(typeIds[0])
  }

  component(id?: string): IPlatform['component'] {
    return this.get(id).component
  }

  componentByType(type: number): IPlatform['component'] {
    return this.component(this.lookup[type])
  }
}

export const platforms = new Platforms()
