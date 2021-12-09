import React from 'react'
import { makeStyles, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from './Icon'

type Props = {
  value: string | number | string[] | number[]
  icon: string
  filterList: { value: string | number; name: string }[]
  onSelect: (value: any) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, filterList, onSelect }) => {
  const css = useStyles()

  const isActive = v => {
    console.log(value, v, Array.isArray(value), Array.isArray(value) && value.includes(v as never))
    if (Array.isArray(value)) return value.includes(v as never)
    else return v === value.toString().replace('-', '')
  }

  return (
    <List dense className={css.list}>
      {filterList.map((f, index) => (
        <ListItem button dense key={index} onClick={() => onSelect(f.value)}>
          <ListItemIcon>{isActive(f.value) && <Icon name={icon} color="primary" />}</ListItemIcon>
          <ListItemText
            primary={f.name}
            primaryTypographyProps={{ color: isActive(f.value) ? 'primary' : undefined }}
          />
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  list: {
    paddingTop: 0,
    '& .MuiListItem-dense': { paddingTop: 0, paddingBottom: 0, paddingLeft: 0 },
  },
})
