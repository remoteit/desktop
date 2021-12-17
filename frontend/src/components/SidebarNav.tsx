import React, { useState } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import { useHistory, useLocation, matchPath } from 'react-router-dom'
import {
  makeStyles,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Badge,
} from '@material-ui/core'
import { spacing } from '../styling'
import { Icon } from './Icon'
import classnames from 'classnames'

export const SidebarNav: React.FC = () => {
  const { menuItems } = useNavigation()
  const [viewBadge, setViewBadge] = useState(true)
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  const dismissBadge = () => setViewBadge(false)

  return (
    <List className={css.list}>
      {menuItems.reduce((items: JSX.Element[], m, index) => {
        const active = matchPath(location.pathname, { path: m.match, exact: true })
        if (m.show)
          items.push(
            <React.Fragment key={index}>
              <ListItem
                key={m.path}
                className={classnames(active && css.active, m.footer && css.footer)}
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
              {m.Menu && <m.Menu />}
            </React.Fragment>
          )
        return items
      }, [])}
    </List>
  )
}

const useStyles = makeStyles( ({ palette }) => ({
  chip: {
    fontWeight: 500,
  },
  list: {
    position: 'static',
    marginTop: spacing.sm,
    '& .MuiListItemText-primary': { color: palette.grayDark.main },
    '& .MuiListItem-button:hover .MuiListItemText-primary': { color: palette.black.main },
    '& .MuiListItem-button:hover path': { color: palette.grayDarkest.main },
  },
  active: {
    backgroundColor: palette.white.main,
    '& .MuiListItemText-primary': {
      color: palette.black.main,
    },
  },
  footer: {
    position: 'absolute',
    bottom: spacing.lg,
  },
}))
