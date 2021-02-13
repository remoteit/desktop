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
                    <Icon name={m.icon} />
                  </Badge>
                ) : (
                  <Icon name={m.icon} />
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
  },
  active: {
    backgroundColor: colors.white,
    borderRadius: spacing.xxs,
  },
})
