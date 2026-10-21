import React from 'react'
import { useLocation } from 'react-router-dom'
import { selectOrganization } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Drawer } from '@mui/material'
import { useChatDocked, useChatToggle } from '../hooks/useChatEnabled'
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
  const closeDrawer = () => {
    dispatch.ui.set({ sidebarMenu: false })
  }

  React.useEffect(() => {
    if (open) closeDrawer()
  }, [location, activeOrgId])

  React.useEffect(() => {
    if (open && chatOverlaid) chat.toggle()
  }, [location])

  // Left open, the drawer remounts open when the sidebar hides again, and the effect above then closes the chat
  React.useEffect(() => closeDrawer, [])

  return (
    <Drawer anchor="left" open={open} onClose={closeDrawer}>
      <Sidebar layout={layout} />
    </Drawer>
  )
}
