import React from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { AccordionMenuItem } from './AccordionMenuItem'
import { Divider } from '@mui/material'

type IAccordionMenu = {
  key: number | string
  disabled?: boolean
  subtitle: string
  onClear?: () => void
  children: React.ReactNode
}

type Props = { menus: IAccordionMenu[] }

export const AccordionMenu: React.FC<Props> = ({ menus }) => {
  const { drawerAccordion } = useSelector((state: ApplicationState) => state.ui)
  const { ui } = useDispatch<Dispatch>()

  return (
    <>
      {menus.map(
        (menu, index) =>
          menu.disabled || (
            <React.Fragment key={index}>
              {!!index && <Divider />}
              <AccordionMenuItem
                expanded={drawerAccordion === menu.key}
                onClick={expanded => ui.setPersistent({ drawerAccordion: expanded ? menu.key : undefined })}
                onClear={menu.onClear}
                subtitle={menu.subtitle}
                square
              >
                {menu.children}
              </AccordionMenuItem>
            </React.Fragment>
          )
      )}
    </>
  )
}
