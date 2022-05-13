import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Drawer } from '@material-ui/core'
import { Sidebar } from './Sidebar'

export const SidebarMenu: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const open = useSelector((state: ApplicationState) => state.ui.sidebarMenu)
  const dispatch = useDispatch<Dispatch>()

  return (
    <Drawer anchor="left" open={open} onClose={() => dispatch.ui.set({ sidebarMenu: false })}>
      <Sidebar layout={layout} />
    </Drawer>
  )
}
