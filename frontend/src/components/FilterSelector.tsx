import React from 'react'
import {
  makeStyles,
  ButtonBase,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@material-ui/core'
import { ExpandIcon } from './ExpandIcon'
import { Icon } from './Icon'

type Props = {
  value: string
  icon: string
  open: boolean
  subtitle: string
  filterList: { value: string; name: string }[]
  onSelect: (value: any) => void
  onAccordion: (expanded: boolean) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, open, subtitle, filterList, onSelect, onAccordion }) => {
  const css = useStyles()
  return (
    <Accordion elevation={0} expanded={open} onChange={(_, expanded) => onAccordion(expanded)}>
      <AccordionSummary>
        <ButtonBase className={css.button}>
          <ListSubheader>
            {subtitle}
            <ExpandIcon open={open} />
          </ListSubheader>
        </ButtonBase>
      </AccordionSummary>
      <AccordionDetails>
        {filterList.map((f, index) => (
          <ListItem button dense key={index} onClick={() => onSelect(f.value)}>
            <ListItemIcon>{f.value === value.replace('-', '') && <Icon name={icon} color="primary" />}</ListItemIcon>
            <ListItemText
              primary={f.name}
              primaryTypographyProps={{ color: f.value === value.replace('-', '') ? 'primary' : undefined }}
            />
          </ListItem>
        ))}
      </AccordionDetails>
    </Accordion>
  )
}

const useStyles = makeStyles({
  button: { width: '100%', display: 'block', textAlign: 'left' },
})
