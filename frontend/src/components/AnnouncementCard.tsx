import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import {
  makeStyles,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  CardMedia,
  CardHeader,
  IconButton,
  Typography,
} from '@material-ui/core'
import { Icon } from './Icon'
import { colors, spacing } from '../styling'

const types = {
  GENERIC: 'Notice',
  SYSTEM: 'System Update',
  RELEASE: 'New',
  COMMUNICATION: 'Announcement',
}

export const AnnouncementCard: React.FC<{ announcement: IAnnouncement }> = ({ announcement }) => {
  const css = useStyles()

  // const announcement = unread[0]
  if (!announcement) return null

  return (
    <Card className={css.notice} elevation={1}>
      <CardHeader title={types[announcement.type]} />
      {announcement.image && <CardMedia className={css.media} image={announcement.image} title={announcement.title} />}
      <CardActionArea>
        <CardContent>
          <Typography variant="h2" gutterBottom>
            {announcement.title}
          </Typography>
          <Typography variant="caption" dangerouslySetInnerHTML={{ __html: announcement.preview }} />
        </CardContent>
      </CardActionArea>
      {/* <CardActions>
        <Button color="primary" size="small" onClick={read}>
          Learn More
        </Button>
      </CardActions> */}
    </Card>
  )
}

const useStyles = makeStyles({
  notice: {
    // position: 'absolute',
    // right: spacing.lg,
    // bottom: 62 + spacing.lg,
    // maxWidth: 300,
    // zIndex: 5,
    overflow: 'hidden',
    backgroundColor: colors.grayLightest,
  },
  media: {
    height: 130,
    backgroundColor: colors.primaryHighlight,
  },
})
