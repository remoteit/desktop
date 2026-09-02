import { CATALOGUE, CatalogueInstallation } from './catalogue.generated'

export interface IPlatform {
  id: string
  name: string
  hidden?: boolean
  subtitle?: string
  component: (props: any) => React.ReactElement
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
    qualifier?: string
    link?: string
    altLink?: string
  }
}

// What a platforms/<id>/index.tsx registers now that the data lives in the API catalogue: the
// id, the code (component, override, listItemTitle, JSX instructions, a conditional altLink)
// and, for routes the catalogue has no row for (this, remoteit, android-screenview), any data
// fields it still needs to supply itself.
export type IPlatformLocal = Partial<IPlatform> & Pick<IPlatform, 'id' | 'component'>

export interface IPlatformOverrideProps {
  platform: IPlatform
  serviceTypes: number[]
  tags?: string[]
  oneTimeUse?: boolean
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
    this.initialize()
  }

  async initialize() {
    for (const platform of this.installed) {
      await import(`./${platform}/index.tsx`)
    }
  }

  // What the API catalogue supplies for a route, in IPlatform's shape. Everything that is
  // data comes from here; the local file keeps only code (component, override, JSX).
  private fromCatalogue(id: string, data: CatalogueInstallation): Pick<IPlatform, 'name' | 'types' | 'services' | 'installation'> {
    const types: INumberLookup<string> = {}
    for (const [typeId, type] of Object.entries(CATALOGUE.types)) {
      if (type.installation === id) types[Number(typeId)] = type.displayName || type.name
    }
    return {
      name: data.name,
      types,
      services: data.services,
      installation: {
        // `true` = show the API's registrationCommand verbatim (the API renders the platform's
        // template); '[CODE]' = show the bare code. The desktop no longer holds any templates.
        command: data.kind === 'command' ? true : data.kind === 'code' ? '[CODE]' : undefined,
        download: data.kind === 'download' || undefined,
        label: data.kind === 'code' ? 'Registration Code' : undefined,
        qualifier: data.qualifier,
        instructions: data.instructions,
        link: data.link,
        altLink: data.altLink,
      },
    }
  }

  register(local: IPlatformLocal) {
    const data = CATALOGUE.installations[local.id]
    const base: IPlatform = { name: local.id, ...local }
    // Catalogue wins for data; the local file wins for code — and for the two installation
    // fields that are code in disguise: JSX instructions and a browser-conditional altLink.
    const fromCatalogue = data && this.fromCatalogue(local.id, data)
    const platform: IPlatform = fromCatalogue
      ? {
          ...base,
          ...fromCatalogue,
          installation: {
            ...fromCatalogue.installation,
            ...(local.installation?.instructions && typeof local.installation.instructions !== 'string' ? { instructions: local.installation.instructions } : {}),
            ...(local.installation && 'altLink' in local.installation ? { altLink: local.installation.altLink } : {}),
          },
        }
      : base
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
