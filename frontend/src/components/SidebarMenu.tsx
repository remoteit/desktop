import React from 'react'
import { useLocation } from 'react-router-dom'
import { selectOrganization } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Drawer } from '@mui/material'
import { Sidebar } from './Sidebar'

export const SidebarMenu: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const activeOrgId = useSelector((state: State) => selectOrganization(state).id)
  const open = useSelector((state: State) => state.ui.sidebarMenu)
  const layout = useSelector((state: State) => state.ui.layout)

  React.useEffect(() => {
    if (open) dispatch.ui.set({ sidebarMenu: false })
  }, [location, activeOrgId])

  return (
    <Drawer anchor="left" open={open} onClose={() => dispatch.ui.set({ sidebarMenu: false })}>
      <Sidebar layout={layout} />
    </Drawer>
  )
}
