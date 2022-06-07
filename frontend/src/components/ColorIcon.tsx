import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import platforms from '../platforms'

export const ColorIcon = ({ name, ...originalProps }) => {
  const props = { ...originalProps, darkMode: useSelector((state: ApplicationState) => state.ui.themeDark) }
  const Icon = platforms.component(name)
  console.log('PLATFORMS', name, platforms.platforms)
  return <Icon {...props} />
}
