import React, { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { dateOptions } from './Duration/Duration'
import { makeStyles } from '@mui/styles'
import { Tooltip, Card, CardContent, CardMedia, CardHeader, CardActions, Button, Typography } from '@mui/material'

const types = {
  GENERIC: 'Notice',
  SYSTEM: 'System Update',
  RELEASE: 'Release Note',
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
  const date = data.read && data.read.toLocaleString(navigator.language, dateOptions)
  const css = useStyles({ unread })

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
      <CardHeader className={css.header} title={types[data.type] || types.GENERIC} action={unread ? undefined : date} />
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
        {typeof data.body === 'string' ? (
          <Typography variant="body2" color="textSecondary" dangerouslySetInnerHTML={{ __html: data.body }} />
        ) : (
          <Typography variant="body2" color="textSecondary">
            {data.body}
          </Typography>
        )}
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

const useStyles = makeStyles(({ palette, breakpoints, spacing }) => ({
  card: {
    width: 500,
    overflow: 'hidden',
    marginTop: spacing(2.25),
    marginLeft: spacing(1.5),
    marginRight: spacing(1.5),
    backgroundColor: palette.grayLightest.main,
    '& .MuiButtonBase-root': { float: 'right' },
    [breakpoints.down('sm')]: { marginLeft: 0, marginRight: 0, width: '100%' },
  },
  header: ({ unread }: { unread: boolean }) => ({
    transition: 'background-color 1s',
    backgroundColor: unread ? palette.primary.main : palette.grayDarker.main,
  }),
  media: {
    height: 150,
    backgroundColor: palette.primaryLight.main,
    [breakpoints.down('sm')]: { height: 100 },
  },
}))
