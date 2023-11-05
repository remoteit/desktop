import React from 'react'
import { useLocation } from 'react-router-dom'
import { selectOrganization } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Drawer } from '@mui/material'
import { Sidebar } from './Sidebar'

export const SidebarMenu: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const { activeOrg, open, layout } = useSelector((state: ApplicationState) => ({
    activeOrg: selectOrganization(state),
    open: state.ui.sidebarMenu,
    layout: state.ui.layout,
  }))

  React.useEffect(() => {
    if (open) dispatch.ui.set({ sidebarMenu: false })
  }, [location, activeOrg])

  return (
    <Drawer anchor="left" open={open} onClose={() => dispatch.ui.set({ sidebarMenu: false })}>
      <Sidebar layout={layout} />
    </Drawer>
  )
}
