import React, { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { dateOptions } from './Duration/Duration'
import {
  makeStyles,
  Tooltip,
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
  SECURITY: 'Security Notice',
  COMMUNICATION: 'Announcement',
}

export const AnnouncementCard: React.FC<{ data: IAnnouncement; scrollPosition?: number }> = ({
  data,
  scrollPosition,
}) => {
  const { announcements } = useDispatch<Dispatch>()
  const [read, setRead] = useState<boolean>(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const unread = !(data.read && data.read < new Date())
  const date = data.read && data.read.toLocaleString(undefined, dateOptions)
  const css = useStyles({ unread })()

  const handleRead = () => {
    setRead(true)
    announcements.read(data.id)
    console.log('READ', data.title)
  }

  useEffect(() => {
    const top = cardRef.current?.offsetTop || 0
    const height = cardRef.current?.offsetHeight || 0
    if (!read && scrollPosition && scrollPosition > top + height) handleRead()
  }, [data.read, scrollPosition])

  if (!data) return null

  return (
    <Card ref={cardRef} className={css.card} elevation={unread ? 3 : 1}>
      <CardHeader className={css.header} title={types[data.type]} action={unread ? undefined : date} />
      {data.image && <CardMedia className={css.media} image={data.image} title={data.title} />}
      <CardContent>
        <Typography variant="h1" gutterBottom>
          {data.title}
          {unread && (
            <Tooltip title="Mark read">
              <Button onClick={handleRead} variant="contained" size="small" color="primary">
                NEW
              </Button>
            </Tooltip>
          )}
        </Typography>
        <Typography variant="body2" color="textSecondary" dangerouslySetInnerHTML={{ __html: data.body }} />
      </CardContent>
      {data.link && (
        <CardActions>
          <Button color={unread ? 'primary' : undefined} href={data.link} size="small" target="_blank">
            Learn more
          </Button>
        </CardActions>
      )}
    </Card>
  )
}

const useStyles = ({ unread }) =>
  makeStyles({
    card: {
      width: 500,
      overflow: 'hidden',
      marginTop: spacing.md,
      marginRight: spacing.md,
      backgroundColor: colors.grayLightest,
      '& .MuiButtonBase-root': { float: 'right' },
    },
    header: {
      transition: 'background-color 1s',
      backgroundColor: unread ? colors.primary : colors.grayDarker,
    },
    media: {
      height: 150,
      backgroundColor: colors.primaryLight,
    },
  })
