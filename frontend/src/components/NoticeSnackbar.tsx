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
import { Icon } from '../components/Icon'
import { colors, spacing } from '../styling'

const types = {
  GENERIC: 'Notice',
  SYSTEM: 'System Notice',
  RELEASE: 'System Update',
  COMMUNICATION: 'Announcement',
}

export const NoticeSnackbar: React.FC = () => {
  const css = useStyles()
  const unread = useSelector((state: ApplicationState) => state.notices.all.filter(n => n.enabled && !n.read))
  const { notices } = useDispatch<Dispatch>()

  const notice = unread[0]
  return null
  // if (!notice) return null

  // const read = () => notices.read(notice.id)

  // return (
  //   <Card className={css.notice} elevation={2}>
  //     <CardHeader
  //       className={css.title}
  //       action={
  //         <IconButton onClick={read}>
  //           <Icon name="times" size="md" color="white" fixedWidth />
  //         </IconButton>
  //       }
  //       title={types[notice.type]}
  //     />
  //     <CardMedia className={css.media} image="/static/images/cards/paella.jpg" title={notice.title} />
  //     <CardActionArea>
  //       <CardContent className={css.preview}>
  //         {notice.preview +
  //           ' This is more text so that we can see what this might look like with a longer message that takes up a lot more space.'}
  //       </CardContent>
  //     </CardActionArea>
  //     <CardActions>
  //       <Button color="primary" size="small" onClick={read}>
  //         Learn More
  //       </Button>
  //     </CardActions>
  //   </Card>
  // )
}

const useStyles = makeStyles({
  notice: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 62 + spacing.lg,
    maxWidth: 300,
    zIndex: 5,
    overflow: 'hidden',
    backgroundColor: colors.grayLightest,
  },
  title: {
    backgroundColor: colors.primary,
  },
  media: {},
  preview: {},
})
