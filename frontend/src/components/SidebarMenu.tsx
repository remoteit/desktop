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
  const { activeOrgId, open, layout } = useSelector((state: State) => ({
    activeOrgId: selectOrganization(state).id,
    open: state.ui.sidebarMenu,
    layout: state.ui.layout,
  }))

  React.useEffect(() => {
    if (open) dispatch.ui.set({ sidebarMenu: false })
  }, [location, activeOrgId])

  return (
    <Drawer anchor="left" open={open} onClose={() => dispatch.ui.set({ sidebarMenu: false })}>
      <Sidebar layout={layout} />
    </Drawer>
  )
}
