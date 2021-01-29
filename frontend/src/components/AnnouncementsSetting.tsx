import React from 'react'
import { makeStyles, ListItemSecondaryAction, Badge } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { colors } from '../styling'

export const AnnouncementsSetting: React.FC = () => {
  const css = useStyles()
  const count = useSelector((state: ApplicationState) => state.announcements.all.length)

  return (
    <ListItemLocation
      dense
      icon="megaphone"
      title="Announcements"
      subtitle="Read system updates and discover new application features."
      pathname="/settings/announcements"
      className={count ? css.active : undefined}
      iconColor={count ? 'primary' : undefined}
    >
      <ListItemSecondaryAction>{count && <Badge color="error" badgeContent={count} />}</ListItemSecondaryAction>
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  active: {
    color: colors.primary,
  },
})
