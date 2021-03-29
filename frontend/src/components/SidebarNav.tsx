import React, { useState } from 'react'
import { useHistory, useLocation, matchPath } from 'react-router-dom'
import { useNavigation } from '../hooks/useNavigation'
import { List, ListItem, ListItemText, ListItemIcon, Badge } from '@material-ui/core'
import { colors } from '../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from './Icon'

export const SidebarNav: React.FC = () => {
  const { menu, menuItems } = useNavigation()
  const [viewBadge, setViewBadge] = useState(true)
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  const dismissBadge = () => setViewBadge(false)

  return (
    <List className={css.list}>
      {menuItems.reduce((items: JSX.Element[], m) => {
        const active = matchPath(location.pathname, { path: m.match, exact: true })
        if (m.show)
          items.push(
            <ListItem
              key={m.path}
              className={active ? css.active : ''}
              onClick={() => history.push(m.path)}
              button
              dense
            >
              <ListItemIcon>
                {m.badge && viewBadge ? (
                  <Badge
                    onClick={dismissBadge}
                    variant={m.badge > 1 ? undefined : 'dot'}
                    badgeContent={m.badge}
                    color="error"
                  >
                    <Icon size="md" type="regular" name={m.icon} color={active ? 'black' : 'grayDark'} />
                  </Badge>
                ) : (
                  <Icon size="md" type="regular" name={m.icon} color={active ? 'black' : 'grayDark'} />
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
