import React, { useState } from 'react'
import { makeStyles, Button, ListSubheader, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'
import { ExpandIcon } from './ExpandIcon'
import { spacing } from '../styling'

type IAccordionMenu = {
  subtitle: string
  expanded?: boolean
  defaultExpanded?: boolean
  gutters?: boolean
  elevation?: number
  square?: boolean
  onClick?: (expanded: boolean) => void
  children?: React.ReactElement
}

export const AccordionMenuItem: React.FC<IAccordionMenu> = ({
  expanded,
  defaultExpanded,
  subtitle,
  gutters,
  elevation = 0,
  square,
  onClick,
  children,
}) => {
  const css = useStyles({ gutters })
  const [open, setOpen] = useState<boolean>(!!defaultExpanded)
  const clickHandler = state => {
    onClick && onClick(state)
    setOpen(!open)
  }

  expanded = expanded === undefined ? open : expanded

  return (
    <Accordion
      square={square}
      elevation={elevation}
      expanded={expanded}
      defaultExpanded={defaultExpanded}
      onChange={(_, state) => clickHandler(state)}
    >
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
  button: ({ gutters }: any) => ({
    width: '100%',
    textAlign: 'left',
    display: 'block',
    padding: 0,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
    marginLeft: gutters && spacing.md,
    marginRight: gutters && spacing.md,
  }),
})
