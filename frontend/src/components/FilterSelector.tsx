import React from 'react'
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { Icon } from './Icon'

type Props = {
  value: string | number | string[] | number[]
  icon: string
  filterList: { value: string | number; name: string; color?: string }[]
  children?: React.ReactNode
  onSelect: (value: any) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, filterList, onSelect, children }) => {
  if (value === undefined) {
    console.warn('FilterSelector: value is undefined', filterList)
    return null
  }

  const isActive = v => {
    if (Array.isArray(value)) return value.includes(v as never)
    else return v === value.toString().replace('-', '')
  }

  return (
    <List dense disablePadding>
      {children}
      {filterList.map((f, index) => (
        <ListItemButton key={index} onClick={() => onSelect(f.value)} sx={{ paddingY: 0 }}>
          <ListItemIcon>{isActive(f.value) && <Icon name={icon} color="primary" />}</ListItemIcon>
          <ListItemText
            style={{ color: f.color ? f.color : undefined }}
            primary={f.name}
            primaryTypographyProps={{ color: !f.color && isActive(f.value) ? 'primary' : undefined }}
          />
        </ListItemButton>
      ))}
    </List>
  )
}
