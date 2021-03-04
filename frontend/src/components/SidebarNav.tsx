import React from 'react'
import { useHistory } from 'react-router-dom'
import { useNavigation } from '../hooks/useNavigation'
import { List, ListItem, ListItemText, ListItemIcon, Badge } from '@material-ui/core'
import { colors, spacing } from '../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from './Icon'

export const SidebarNav: React.FC = () => {
  const [menu, menuItems] = useNavigation()
  const history = useHistory()
  const css = useStyles()

  return (
    <List className={css.list}>
      {menuItems.reduce((items: JSX.Element[], m) => {
        if (m.show)
          items.push(
            <ListItem
              key={m.path}
              className={menu === m.path ? css.active : ''}
              onClick={() => history.push(m.path)}
              button
              dense
            >
              <ListItemIcon>
                {m.badge ? (
                  <Badge variant={m.badge > 1 ? undefined : 'dot'} badgeContent={m.badge} color="error">
                    <Icon size="md" type="regular" name={m.icon} color={menu === m.path ? 'black' : 'grayDark'} />
                  </Badge>
                ) : (
                  <Icon size="md" type="regular" name={m.icon} color={menu === m.path ? 'black' : 'grayDark'} />
                )}
              </ListItemIcon>
              <ListItemText primary={m.label} />
            </ListItem>
          )
        return items
      }, [])}
    </List>
  )
}

const useStyles = makeStyles({
  list: {
    // borderTop: `1px solid ${colors.grayLight}`,
    '& .MuiListItemText-primary': { color: colors.grayDark },
    '& .MuiListItem-button:hover .MuiListItemText-primary': { color: colors.black },
    '& .MuiListItem-button:hover path': { color: colors.grayDarkest },
  },
  active: {
    backgroundColor: colors.white,
    '& .MuiListItemText-primary': {
      color: colors.black,
    },
  },
})
