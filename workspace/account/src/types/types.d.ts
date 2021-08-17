declare global {
 

  type INavigation = {
    label: string
    path: string
    match?: string
    icon: string
    show?: boolean
    badge?: number
    chip?: number
  }

  type IHeaderNavigation = {
    label: string
    path: string
  }
}

export {}
