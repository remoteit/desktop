import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { platforms } from '../platforms'

type Props = React.SVGProps<SVGSVGElement> & {
  name?: string
  platform?: number
  currentColor?: boolean
}

export const PlatformIcon: React.FC<Props> = ({ name, platform, ...originalProps }) => {
  const props = { ...originalProps, darkMode: useSelector((state: State) => state.ui.themeDark) }
  const Component = platform !== undefined ? platforms.componentByType(platform) : platforms.component(name)
  return <Component {...props} />
}
