import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { IconButton } from './IconButton'

export const SidebarMenuButton: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  return <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
}
