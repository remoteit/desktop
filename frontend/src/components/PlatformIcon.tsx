import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { platforms } from '../platforms'

type Props = {
  name?: string
  platform?: number
  className?: string
}

export const PlatformIcon: React.FC<Props> = ({ name, platform, ...originalProps }) => {
  const props = { ...originalProps, darkMode: useSelector((state: ApplicationState) => state.ui.themeDark) }
  const Component = platform !== undefined ? platforms.componentByType(platform) : platforms.component(name)
  return <Component {...props} />
}
