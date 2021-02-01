import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { dateOptions } from './Duration/Duration'
import {
  makeStyles,
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  CardActions,
  Button,
  Typography,
} from '@material-ui/core'
import { colors, spacing } from '../styling'

const types = {
  GENERIC: 'Notice',
  SYSTEM: 'System Update',
  RELEASE: 'New',
  COMMUNICATION: 'Announcement',
}

export const AnnouncementCard: React.FC<{ data: IAnnouncement }> = ({ data }) => {
  const { announcements } = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    // TODO only call read if announcement is in view
    if (!data.read) setTimeout(() => announcements.read(data.id), 1000)
  }, [data.read])

  if (!data) return null

  const unread = !(data.read && data.read < new Date())
  const date = data.read && data.read.toLocaleString(undefined, dateOptions)

  return (
    <Card className={css.card} elevation={1}>
      <CardHeader
        className={css.header}
        title={types[data.type]}
        style={{ backgroundColor: unread ? colors.success : colors.primary }}
        action={unread ? 'New' : date}
      />
      {data.image && <CardMedia className={css.media} image={data.image} title={data.title} />}
      <CardContent>
        <Typography variant="h1" gutterBottom>
          {data.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" dangerouslySetInnerHTML={{ __html: data.body }} />
      </CardContent>
      {data.link && (
        <CardActions>
          <Button color="primary" href={data.link} size="small" target="_blank">
            Learn more
          </Button>
        </CardActions>
      )}
    </Card>
  )
}

const useStyles = makeStyles({
  card: {
    width: 500,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginRight: spacing.md,
    backgroundColor: colors.grayLightest,
  },
  header: {
    transition: 'background-color 1s',
  },
  media: {
    height: 150,
    backgroundColor: colors.primaryLight,
  },
})
