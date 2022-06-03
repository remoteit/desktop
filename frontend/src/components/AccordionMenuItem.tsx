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
  onClear?: () => void
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
  onClear,
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
      <AccordionSummary className={css.item}>
        <Button>
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
