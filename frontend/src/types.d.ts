import { Color as ColorType, ColorPartial } from '@mui/material/styles/createPalette'
import { SafeAreaInsets } from 'capacitor-plugin-safe-area'
import { Application } from './shared/applications'
import { Attribute } from './components/Attributes'
import { Color } from './styling'

declare global {
  interface Window {
    clarity?: any
  }

  type DiagramGroupType =
    | 'target'
    | 'initiator'
    | 'public'
    | 'tunnel'
    | 'relay'
    | 'agent'
    | 'proxy'
    | 'lan'
    | 'endpoint'

  type Methods = (() => void)[]

  interface IDeviceListContext {
    device?: IDevice
    connections?: IConnection[]
    required?: Attribute
    attributes?: Attribute[]
  }

  interface IDeviceContext {
    user: IUser
    device?: IDevice
    network?: INetwork
    connections: IConnection[]
    service?: IService
    connection: IConnection
    instance?: IInstance
    waiting: boolean
  }

  interface IDiagramContext {
    toTypes?: { [key in DiagramGroupType]?: string }
    errorTypes: DiagramGroupType[]
    activeTypes: DiagramGroupType[]
    highlightTypes: DiagramGroupType[]
    state?: IConnectionState
    proxy?: boolean
    relay?: boolean
  }

  type IPortScan = 'REACHABLE' | 'UNREACHABLE' | 'SCANNING' | 'INVALID'

  type IOrganizationProvider = 'SAML' | 'OIDC'

  type IOrganizationSettings = {
    name?: string
    domain?: string
    providers?: null | IOrganizationProvider[]
    accountId?: string
  }

  type IIdentityProviderSettings = {
    accountId?: string
    enabled: boolean
    type: IOrganizationProvider
    metadata?: string
    clientId?: string
    clientSecret?: string
    issuer?: string
  }

  type ILicenseChip = {
    name: string
    colorName: Color
    background?: string
    hoverColor?: string
    disabled?: boolean
    show?: boolean
  }
  type ILimit = {
    name: string
    value: any
    actual: any
    license: { id: string } | null
  }

  type ILicense = {
    id: string
    created: Date
    updated: Date
    expiration: Date | null
    valid: boolean
    quantity: number | null
    plan: IPlan
    subscription?: ISubscription
    managePath?: string
    limits?: ILimit[]
    custom: boolean
  }

  type ISubscription = {
    total: number | null
    status: 'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAST_DUE' | 'TRIALING' | 'UNPAID' | null
    price: IPrice | null
    card: ICard | null
  }

  type ICard = {
    brand: string
    country: string
    email: string
    expiration: Date
    last: string
    month: number
    name: string
    phone: string
    postal: string
    year: number
  }

  type IPlan = {
    id?: string
    name: IPlanName
    description: string
    duration: string | null
    commercial?: boolean
    billing?: boolean
    product: {
      id: string
      name: string
      description: string
    }
    prices?: IPrice[]
  }

  type IPrice = {
    id: string
    amount: number
    currency: string
    interval: IPlanInterval | null
  }
  type IPlanName = 'PERSONAL' | 'PROFESSIONAL' | 'TRIAL' | string
  type IPlanInterval = 'MONTH' | 'YEAR'

  type IInvoice = {
    price: {
      id: string
      amount: number
      currency: string
      interval: IPlanInterval
    }
    id: string
    plan: IPlan
    quantity: number
    total: number
    currency: string
    paid: boolean
    url?: string
    created: Date
  }

  type IAnnouncement = {
    id: string
    type: INoticeType
    title: string
    link: string
    image: string
    body: string
    modified?: Date
    read?: Date
  }

  type INoticeType = 'GENERIC' | 'SYSTEM' | 'RELEASE' | 'COMMUNICATION' | 'SECURITY'

  type IPurchase = {
    checkout?: boolean
    planId?: string
    priceId?: string
    quantity: number
    accountId: string
    confirm?: boolean
  }

  type LogType = 'general' | 'connectd' | 'alert'

  interface Log {
    type: LogType
    message: string
    data?: any
    createdAt?: Date
  }

  type IconType = 'light' | 'regular' | 'solid' | 'brands'

  /**
   * Action which are called by components that are wrapped
   * by the context API store.
   */
  interface Action {
    type: string
    [key: string]: any
  }

  type IDataOptions = {
    application?: Application
    device?: IDevice
    instance?: IInstance
    service?: IService
    connection?: IConnection
    session?: ISession
    connections?: IConnection[]
  }

  type IContextMenu = { el?: HTMLElement; serviceID?: string }

  type IGlobalTooltip = {
    el?: HTMLElement
    title: React.ReactElement | string
    color?: string
    children?: React.ReactNode
  }

  type ILayout = {
    insets: SafeAreaInsets['insets']
    mobile: boolean
    showOrgs: boolean
    hideSidebar: boolean
    singlePanel: boolean
    sidePanelWidth: number
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    primaryLight: ColorType
    primaryLighter: ColorType
    primaryHighlight: ColorType
    primaryBackground: ColorType
    secondary: ColorType
    successLight: ColorType
    success: ColorType
    successDark: ColorType
    dangerLight: ColorType
    danger: ColorType
    warning: ColorType
    warningLightest: ColorType
    warningHighlight: ColorType
    gray: ColorType
    grayLightest: ColorType
    grayLighter: ColorType
    grayLight: ColorType
    grayDark: ColorType
    grayDarker: ColorType
    grayDarkest: ColorType
    white: ColorType
    black: ColorType
    alwaysWhite: ColorType
    darken: ColorType
    screen: ColorType
    rpi: ColorType
    guide: ColorType
    test: ColorType
  }
  interface PaletteOptions {
    primaryLight?: ColorPartial
    primaryLighter?: ColorPartial
    primaryHighlight?: ColorPartial
    primaryBackground?: ColorPartial
    secondary?: ColorPartial
    successLight?: ColorPartial
    success?: ColorPartial
    successDark?: ColorPartial
    dangerLight?: ColorPartial
    danger?: ColorPartial
    warning?: ColorPartial
    warningLightest: ColorPartial
    warningHighlight: ColorPartial
    gray?: ColorPartial
    grayLightest?: ColorPartial
    grayLighter?: ColorPartial
    grayLight?: ColorPartial
    grayDark?: ColorPartial
    grayDarker?: ColorPartial
    grayDarkest?: ColorPartial
    white?: ColorPartial
    black?: ColorPartial
    alwaysWhite?: ColorPartial
    darken?: ColorPartial
    screen?: ColorPartial
    rpi?: ColorPartial
    guide?: ColorPartial
    test?: ColorPartial
  }
}

export {}
