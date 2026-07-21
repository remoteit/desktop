import React, { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { dateDefaults } from './Duration/Duration'
import { Tooltip, Card, CardContent, CardMedia, CardHeader, CardActions, Button, Typography } from '@mui/material'

const types = {
  GENERIC: 'Notice',
  SYSTEM: 'System Update',
  RELEASE: 'Release Note',
  SECURITY: 'Security Notice',
  COMMUNICATION: 'Announcement',
}

export const AnnouncementCard: React.FC<{ data: IAnnouncement; scrollPosition?: number; hideMarkReadAction?: boolean }> = ({
  data,
  scrollPosition,
  hideMarkReadAction,
}) => {
  const { announcements } = useDispatch<Dispatch>()
  const [read, setRead] = useState<boolean>(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const unread = !(data.read && data.read < new Date())
  const modified = data.modified && data.modified.toLocaleString(navigator.language, dateDefaults)

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
    <Card
      ref={cardRef}
      sx={theme => ({
        width: 500,
        overflow: 'hidden',
        marginTop: 2.25,
        marginLeft: 1.5,
        marginRight: 1.5,
        backgroundColor: theme.palette.grayLightest.main,
        '& .MuiButtonBase-root': { float: 'right' },
        [theme.breakpoints.down('sm')]: { marginLeft: 0, marginRight: 0, width: '100%' },
      })}
      elevation={unread ? 3 : 1}
    >
      <CardHeader
        sx={theme => ({
          transition: 'background-color 1s',
          backgroundColor: unread ? theme.palette.primary.main : theme.palette.grayDarker.main,
        })}
        title={types[data.type] || types.GENERIC}
        action={modified}
      />
      {data.image && (
        <CardMedia
          sx={theme => ({
            height: 150,
            backgroundColor: theme.palette.primaryLight.main,
            [theme.breakpoints.down('sm')]: { height: 100 },
          })}
          image={data.image}
          title={data.title}
        />
      )}
      <CardContent>
        <Typography variant="h1" gutterBottom>
          {data.title}
          {unread && !hideMarkReadAction && (
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

