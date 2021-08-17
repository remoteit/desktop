import React, { useState } from 'react'
import { Divider } from '@material-ui/core'
import { AccordionMenuItem } from './AccordionMenuItem'

type IAccordionMenu = {
  key: number | string
  subtitle: string
  children: React.ReactElement
}

export const AccordionMenu: React.FC<{ menus: IAccordionMenu[]; defaultExpanded?: string | number }> = ({
  menus,
  defaultExpanded,
}) => {
  const [expanded, setExpanded] = useState<string | number | undefined>(defaultExpanded)

  return (
    <>
      {menus.map((menu, index) => (
        <React.Fragment key={index}>
          {!!index && <Divider />}
          <AccordionMenuItem
            expanded={expanded === menu.key}
            onClick={expanded => setExpanded(expanded ? menu.key : undefined)}
            subtitle={menu.subtitle}
          >
            {menu.children}
          </AccordionMenuItem>
        </React.Fragment>
      ))}
    </>
  )
}
