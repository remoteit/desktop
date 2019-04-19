declare global {
  export type FontSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

  export type IconWeight = 'light' | 'regular' | 'solid'

  export type BrandColors =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'muted'
    | 'white'
  interface Window {
    process?: {
      type?: string
    }
  }
}

export {}
