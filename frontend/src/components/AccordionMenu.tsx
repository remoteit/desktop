import React, { useState } from 'react'
import { Divider } from '@material-ui/core'
import { AccordionMenuItem } from './AccordionMenuItem'

type IAccordionMenu = {
  key: number | string
  subtitle: string
  onClear?: () => void
  children: React.ReactElement
}

type Props = {
  menus: IAccordionMenu[]
  defaultExpanded?: string | number
}

export const AccordionMenu: React.FC<Props> = ({ menus, defaultExpanded }) => {
  const [expanded, setExpanded] = useState<string | number | undefined>(defaultExpanded)

  return (
    <>
      {menus.map((menu, index) => (
        <React.Fragment key={index}>
          {!!index && <Divider />}
          <AccordionMenuItem
            expanded={expanded === menu.key}
            onClick={expanded => setExpanded(expanded ? menu.key : undefined)}
            onClear={menu.onClear}
            subtitle={menu.subtitle}
            square
          >
            {menu.children}
          </AccordionMenuItem>
        </React.Fragment>
      ))}
    </>
  )
}
