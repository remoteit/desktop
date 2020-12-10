import React from 'react'
import { Divider, ListItem, ListItemIcon, ListItemText, ListSubheader } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = {
  value: string
  icon: string
  subtitle: string
  filterList: { value: string; name: string }[]
  onSelect: (value: any) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, subtitle, filterList, onSelect }) => {
  return (
    <>
      <Divider />
      <ListSubheader>{subtitle}</ListSubheader>
      {filterList.map((f, index) => (
        <ListItem button dense key={index} onClick={() => onSelect(f.value)}>
          <ListItemIcon>{f.value === value.replace('-', '') && <Icon name={icon} color="primary" />}</ListItemIcon>
          <ListItemText
            primary={f.name}
            primaryTypographyProps={{ color: f.value === value.replace('-', '') ? 'primary' : undefined }}
          />
        </ListItem>
      ))}
    </>
  )
}
