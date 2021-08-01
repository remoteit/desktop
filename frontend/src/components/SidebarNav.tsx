import React, { useState } from 'react'
import { useHistory, useLocation, matchPath } from 'react-router-dom'
import { useNavigation } from '../hooks/useNavigation'
import { List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Chip, Badge } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { colors } from '../styling'
import { Icon } from './Icon'

export const SidebarNav: React.FC = () => {
  const { menuItems } = useNavigation()
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
              {!!Number(m.chip) && (
                <ListItemSecondaryAction>
                  <Chip
                    size="small"
                    label={m.chip}
                    className={m.chipPrimary ? css.chip : undefined}
                    color={m.chipPrimary ? 'primary' : undefined}
                  />
                </ListItemSecondaryAction>
              )}
            </ListItem>
          )
        return items
      }, [])}
    </List>
  )
}

const useStyles = makeStyles({
  chip: {
    fontWeight: 500,
  },
  list: {
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
