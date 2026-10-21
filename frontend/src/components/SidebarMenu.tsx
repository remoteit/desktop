import React from 'react'
import { useLocation } from 'react-router-dom'
import { selectOrganization } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Drawer } from '@mui/material'
import { useChatDocked, useChatToggle } from '../hooks/useChatEnabled'
import { IconButton } from '../buttons/IconButton'
import { Sidebar } from './Sidebar'

export const SidebarMenu: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const activeOrgId = useSelector((state: State) => selectOrganization(state).id)
  const open = useSelector((state: State) => state.ui.sidebarMenu)
  const layout = useSelector((state: State) => state.ui.layout)
  const chat = useChatToggle()
  const chatDocked = useChatDocked()
  const chatOverlaid = chat.show && chat.open && !chatDocked

  React.useEffect(() => {
    if (open) dispatch.ui.set({ sidebarMenu: false })
  }, [location, activeOrgId])

  React.useEffect(() => {
    if (open && chatOverlaid) dispatch.chat.set({ open: false })
  }, [location])

  return (
    <Drawer anchor="left" open={open} onClose={() => dispatch.ui.set({ sidebarMenu: false })}>
      <Sidebar layout={layout} />
    </Drawer>
  )
}

export const SidebarMenuButton: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  return <IconButton name="bars" size="md" color="grayDarker" onClick={() => dispatch.ui.set({ sidebarMenu: true })} />
}
