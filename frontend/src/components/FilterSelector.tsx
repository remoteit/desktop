import React from 'react'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from './Icon'

type Props = {
  value: string
  icon: string
  filterList: { value: string; name: string }[]
  onSelect: (value: any) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, filterList, onSelect }) => {
  return (
    <>
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
