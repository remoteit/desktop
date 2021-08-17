import React from 'react'
import { makeStyles, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from './Icon'

type Props = {
  value: string
  icon: string
  filterList: { value: string; name: string }[]
  onSelect: (value: any) => void
}

export const FilterSelector: React.FC<Props> = ({ value, icon, filterList, onSelect }) => {
  const css = useStyles()

  return (
    <List dense className={css.list}>
      {filterList.map((f, index) => (
        <ListItem button dense key={index} onClick={() => onSelect(f.value)}>
          <ListItemIcon>{f.value === value.replace('-', '') && <Icon name={icon} color="primary" />}</ListItemIcon>
          <ListItemText
            primary={f.name}
            primaryTypographyProps={{ color: f.value === value.replace('-', '') ? 'primary' : undefined }}
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
