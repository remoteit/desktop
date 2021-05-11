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
import { Icon } from './Icon'

type Props = {
  value: string
  icon: string
  subtitle: string
  filterList: { value: string; name: string }[]
  onSelect: (value: any) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, subtitle, filterList, onSelect }) => {
  const css = useStyles()
  return (
    <Accordion elevation={0}>
      <AccordionSummary>
        <ButtonBase className={css.button}>
          <ListSubheader>{subtitle}</ListSubheader>
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
