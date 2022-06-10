import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { platforms } from '../platforms'

export const PlatformIcon: React.FC<{ name?: string; platform?: number }> = ({ name, platform, ...originalProps }) => {
  const props = { ...originalProps, darkMode: useSelector((state: ApplicationState) => state.ui.themeDark) }
  const Component = platform !== undefined ? platforms.componentByType(platform) : platforms.component(name)
  return <Component {...props} />
}
