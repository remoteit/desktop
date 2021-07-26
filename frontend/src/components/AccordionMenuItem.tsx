import React, { useState } from 'react'
import { makeStyles, Button, ListSubheader, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'
import { ExpandIcon } from './ExpandIcon'
import { spacing } from '../styling'

type IAccordionMenu = {
  subtitle: string
  expanded?: boolean
  defaultExpanded?: boolean
  gutterTop?: boolean
  onClick?: (expanded: boolean) => void
  children?: React.ReactElement
}

export const AccordionMenuItem: React.FC<IAccordionMenu> = ({
  expanded,
  defaultExpanded,
  subtitle,
  gutterTop,
  onClick,
  children,
}) => {
  const css = useStyles({ gutterTop })
  const [open, setOpen] = useState<boolean>(!!defaultExpanded)
  const clickHandler = state => {
    onClick && onClick(state)
    setOpen(!open)
  }

  expanded = expanded === undefined ? open : expanded

  return (
    <Accordion
      elevation={0}
      expanded={expanded}
      defaultExpanded={defaultExpanded}
      onChange={(_, state) => clickHandler(state)}
    >
      <AccordionSummary className={css.accordion}>
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
  accordion: ({ gutterTop }: { gutterTop?: boolean }) => ({
    marginTop: gutterTop ? spacing.sm : 0,
    '&.Mui-expanded': { marginTop: gutterTop ? spacing.sm : 0 },
  }),
  button: {
    width: '100%',
    textAlign: 'left',
    display: 'block',
    padding: 0,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
})
