import React, { useState } from 'react'
import { makeStyles, Button, ListSubheader, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'
import { ExpandIcon } from './ExpandIcon'
import { spacing } from '../styling'

type IAccordionMenu = {
  subtitle: string
  expanded?: boolean
  defaultExpanded?: boolean
  onClick?: (expanded: boolean) => void
  children?: React.ReactElement
}

export const AccordionMenuItem: React.FC<IAccordionMenu> = ({
  expanded,
  defaultExpanded,
  subtitle,
  onClick,
  children,
}) => {
  const css = useStyles()
  const [open, setOpen] = useState<boolean>(!!defaultExpanded)
  const clickHandler = state => {
    onClick && onClick(state)
    setOpen(!open)
  }

  expanded = expanded === undefined ? open : expanded

  return (
    <Accordion elevation={0} expanded={expanded} onChange={(_, state) => clickHandler(state)}>
      <AccordionSummary>
        <Button className={css.button}>
          <ListSubheader>
            {subtitle}
            <ExpandIcon open={expanded} />
          </ListSubheader>
        </Button>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}

const useStyles = makeStyles({
  button: {
    width: '100%',
    textAlign: 'left',
    display: 'block',
    padding: 0,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
})
