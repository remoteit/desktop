import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Button, ListSubheader, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { ExpandIcon } from './ExpandIcon'
import { spacing } from '../styling'

type IAccordionMenu = {
  subtitle: string
  expanded?: boolean
  defaultExpanded?: boolean
  gutters?: boolean
  elevation?: number
  square?: boolean
  onClear?: () => void
  onClick?: (expanded: boolean) => void
  action?: React.ReactNode
  children?: React.ReactNode
}

export const AccordionMenuItem: React.FC<IAccordionMenu> = ({
  expanded,
  defaultExpanded,
  subtitle,
  gutters,
  elevation = 0,
  square,
  onClear,
  onClick,
  action,
  children,
}) => {
  const css = useStyles({ gutters })
  const [open, setOpen] = useState<boolean>(!!defaultExpanded)
  const clickHandler = () => {
    onClick && onClick(!open)
    setOpen(!open)
  }

  expanded = expanded === undefined ? open : expanded

  return (
    <Accordion square={square} elevation={elevation} expanded={expanded} defaultExpanded={defaultExpanded}>
      <AccordionSummary className={css.item}>
        <Button onClick={clickHandler}>
          <ListSubheader disableGutters>
            {subtitle}
            <ExpandIcon open={expanded} />
          </ListSubheader>
        </Button>
        {onClear && (
          <Button
            size="small"
            color="primary"
            onClick={event => {
              event.stopPropagation()
              onClear()
            }}
          >
            Clear
          </Button>
        )}
        {action && action}
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}

const useStyles = makeStyles({
  item: ({ gutters }: any) => ({
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
    marginLeft: gutters && spacing.md,
    marginRight: gutters && spacing.md,
    '& .MuiIconButton-root': {
      marginTop: -spacing.xxs,
      marginBottom: -spacing.xxs,
    },
    '& .MuiButton-root:first-child': {
      width: '100%',
      textAlign: 'left',
      display: 'block',
      padding: 0,
      margin: 0,
    },
    '& .MuiButton-root + .MuiButton-root': {
      marginRight: spacing.md,
    },
  }),
})
