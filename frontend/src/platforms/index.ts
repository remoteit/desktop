import { CATALOGUE, CatalogueInstallation } from './catalogue'

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
    description?: string
    // Where the platform is installed from — catalogue data.
    link?: string
    // Client capabilities, never catalogue data (see catalogue.ts): show the OEM provisioning
    // guide (OEM_GUIDE_LINK), and offer to register the machine this app is running on
    // (DEVICE_SETUP_PATH). Set in a local platform file, the second one OS-conditionally.
    oemGuide?: boolean
    addThisDevice?: boolean
  }
}

// What a platforms/<id>/index.tsx registers now that the data lives in the API catalogue: the
// id and the code (component, override, listItemTitle, JSX instructions, the client-capability
// flags oemGuide / addThisDevice). A route the catalogue has no row for (the hidden android-screenview deep link) still
// supplies its own data. Any DEFINED field a local file sets wins over the catalogue — so a
// hot-fix in a local file takes effect — while an undefined one (a client-capability flag that
// is off on this OS) falls through to the catalogue value.
export type IPlatformLocal = Partial<IPlatform> & Pick<IPlatform, 'id' | 'component'>

export interface IPlatformOverrideProps {
  platform: IPlatform
  serviceTypes: number[]
  tags?: string[]
  oneTimeUse?: boolean
}

// Only the keys whose value is not undefined.
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

  // The catalogue drives what exists; local files attach code. Every type gets its name (so the
  // legacy types with no page still resolve instead of "Unknown"), and every page without a
  // local file is registered with no logo — so a platform added in the API shows up in lists,
  // filters and /add before the desktop ships a logo for it.
  private seedFromCatalogue() {
    for (const [typeId, label] of Object.entries(CATALOGUE.types)) {
      this.nameLookup[Number(typeId)] = label
    }
    for (const id of Object.keys(CATALOGUE.installations)) {
      // No logo until a local file ships one; PlatformIcon already tolerates a null render.
      if (!this.installed.includes(id))
        this.register({ id, component: (() => null) as unknown as IPlatform['component'] })
    }
  }

  async initialize() {
    for (const platform of this.installed) {
      await import(`./${platform}/index.tsx`)
    }
  }

  // What the API catalogue supplies for a route, in IPlatform's shape. Everything that is
  // data comes from here; the local file keeps only code (component, override, JSX).
  private fromCatalogue(data: CatalogueInstallation): Pick<IPlatform, 'name' | 'types' | 'services' | 'installation'> {
    const types: INumberLookup<string> = {}
    for (const [typeId, label] of Object.entries(data.types)) types[Number(typeId)] = label
    const installation: NonNullable<IPlatform['installation']> = {
      // command: a bespoke template is substituted client-side (Docker, IDY); `true` shows the
      // API's registrationCommand verbatim; '[CODE]' shows the bare code.
      command: data.kind === 'command' ? data.commandTemplate ?? true : data.kind === 'code' ? '[CODE]' : undefined,
      // download: an app or agent to fetch first. A code row WITH a link is that too — Android:
      // install ScreenView from the store, the code is the manual fallback.
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
          ...catalogue,
          // A local file's DEFINED values win (JSX instructions, an OS-matched capability flag, any
          // deliberate override); its undefined ones fall through to the catalogue.
          services: catalogue.services ?? local.services,
          installation: { ...catalogue.installation, ...defined(local.installation) },
        }
      : base
    platform.types = platform.types || {}
    platform.hasScreenView = platform.services?.some(s => s.application === 48)
    this.platforms[platform.id] = platform
    Object.keys(platform.types).forEach(type => {
      if (platform.hidden) return
      // Several pages can onboard one type (Debian: `linux` and `ubuntu`); its devices render as
      // the default page, not whichever registered last.
      const routes = CATALOGUE.routes[type]
      if (routes && routes[0] !== platform.id) return
      this.lookup[type] = platform.id
      this.nameLookup[type] = platform.types?.[type]
    })
  }

  type(type: number): IPlatform {
    const id = this.lookup[type]
    if (id) return this.get(id)

    // A catalogue type with no /add page (31 legacy types: Lorex, Astak, Philips…) has a name
    // but no platform of its own. Answer with the unknown platform's icon carrying the real
    // name, so device lists and tooltips show "x86 Generic Linux" rather than "Unknown".
    const name = this.nameLookup[type]

    return name ? { ...this.get('unknown'), name, types: { [type]: name } } : this.get('unknown')
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
