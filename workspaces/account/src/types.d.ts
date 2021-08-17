import { Color } from './styling'

declare global {
 
  type IconType = 'light' | 'regular' | 'solid' | 'brands'

  export interface Transaction {
    id: string
    paid: boolean
    totalInCents: number
    currency: Currency
    description: string
    subscriptionID: string
    quantity: number
    createdAt: Date
    daysRemaining: number
    invoiceUrl: string
  }

  export type Currency = 'USD'
  

  export interface ILicenses {
    created: Date
    expiration: string
    plan: IPlan
    updated: Date
    valid: boolean
  }

  export interface ILimit {
    name: string
    value: string
    actual: number
    license: {}
  }

  export interface IPasswordValue {
    currentPassword: string
    password: string
  }

  export interface RawTransaction {
    id: string
    paid: boolean
    total: number
    currency: string
    description: string
    subscription: string
    quantity: number
    created: number
    created_local: string
    charge: any
    amount_refunded: number
    available_refund: number
    days_remaining: number
    invoiceUrl: string
  }

  export interface RemoteItPlan {
    id?: string
    commercial?: boolean
    trial?: boolean
    name: string
    expires?: Date
    lastTransaction?: Date
    quantity?: number
    price?: number
  }

  type IUser = {
    id: string
    email: string
    authHash?: string
    yoicsId?: string
    created?: Date
    timestamp?: Date
    scripting?: boolean // @FIXME why do we have scripting on a user seems like a share setting
    metadata?: IMetadata
    plan?: RemoteItPlan
  }
 

  interface Window {
    //Auth class
    authService: AuthService
    process?: {
      type?: string
    }
    analytics: AnalyticsJS
  }

  type ManufacturerDetails = {
    manufacturer: {
      id?: string
    }
    product: {
      id?: string
      version?: string
      platform?: number
      appCode?: number //called manufacturerId in connectd
    }
  }

  type ILookup<T> = { [key: string]: T }

  type ISimpleError = { code?: number; message: string }
  

  type SegmentContext = {
    category?: string
    appName?: string
    appVersion?: string
    systemOS?: string
    systemOSVersion?: string
    systemArch?: string
    manufacturerId?: string
    productVersion?: string
    productId?: string
    productPlatform?: number
    productAppCode?: number
    oobAvailable?: boolean
    oobActive?: boolean
    url?: string
    search?: string
    referrer?: string
  }

  type INotificationSetting = {
    emailNotifications?: boolean
    desktopNotifications?: boolean
    urlNotifications?: boolean
    notificationEmail?: string
    notificationUrl?: string
  }

  type IPlan = {
    type: RemoteItPlanName
    amount?: number
    quantity: number
    token: string
  }


}


export {}
