import React from 'react'
import { useNavigation } from '../hooks/useNavigation'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectAnnouncements } from '../models/announcements'
import { useHistory, useLocation, matchPath } from 'react-router-dom'
import {
  makeStyles,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Chip,
} from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { spacing } from '../styling'
import { Icon } from './Icon'
import classnames from 'classnames'

export const SidebarNav: React.FC = () => {
  const { unreadAnnouncements } = useSelector((state: ApplicationState) => ({
    unreadAnnouncements: selectAnnouncements(state, true).length,
  }))
  const { menuItems } = useNavigation()
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  return (
    <List className={css.list}>
      {menuItems.reduce((items: JSX.Element[], m, index) => {
        const active = matchPath(location.pathname, { path: m.match, exact: true })
        if (m.show)
          items.push(
            <React.Fragment key={index}>
              <ListItem
                className={classnames(active && 'Mui-selected')}
                onClick={() => history.push(m.path)}
                button
                dense
              >
                <ListItemIcon>
                  <Icon size="md" type="regular" name={m.icon} color={active ? 'black' : 'grayDark'} />
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
            </React.Fragment>
          )
        return items
      }, [])}
      <ListItemLocation title="Logs" pathname="/logs" icon="file-alt" dense />
      <Divider variant="inset" />
      <ListItemLink title="Scripting" href="https://app.remote.it/#scripting" icon="scroll" dense />
      <ListItemLink title="Registrations" href="https://app.remote.it/#registrations" icon="upload" dense />
      <ListItemLink title="Products" href="https://app.remote.it/#products" icon="server" dense />
      <Divider variant="inset" />
      <ListItemLocation
        title="Announcements"
        pathname="/announcements"
        icon="megaphone"
        badge={unreadAnnouncements}
        dense
      />
      <ListItemLocation title="Feedback" className={css.footer} pathname="/shareFeedback" icon="comment-smile" dense />
    </List>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  chip: {
    fontWeight: 500,
  },
  list: {
    position: 'static',
    marginTop: spacing.sm,
    '& .MuiListItemText-primary': { color: palette.grayDark.main },
    '& .MuiListItem-button:hover .MuiListItemText-primary': { color: palette.black.main },
    '& .MuiListItem-button:hover path': { color: palette.grayDarkest.main },
    '& .MuiDivider-root': { margin: `${spacing.md}px ${spacing.lg}px`, backgroundColor: palette.grayLight.main },
    '& .Mui-selected': {
      backgroundColor: palette.white.main,
      '& .MuiListItemText-primary': {
        color: palette.black.main,
      },
    },
  },
  footer: {
    position: 'absolute',
    bottom: spacing.lg,
  },
}))
