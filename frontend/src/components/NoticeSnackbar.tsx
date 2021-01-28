import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Snackbar, Button, Paper, IconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'
import { colors } from '../styling'

export const NoticeSnackbar: React.FC = () => {
  const css = useStyles()
  const unread = useSelector((state: ApplicationState) => state.notices.all.filter(n => n.enabled && !n.read))
  const { notices } = useDispatch<Dispatch>()

  const notice = unread[0]

  if (!notice) return null

  return (
    <Paper className={css.notice}>
      {notice.preview +
        ' This is more text so that we can see what this might look like with a longer message that takes up a lot more space.'}
      <Button key={0} size="small" onClick={() => notices.read(notice.id)}>
        View
      </Button>
    </Paper>
  )

  // return (
  //   <Snackbar
  //     open={!!unread.length}
  //     message={
  //       notice.preview +
  //       ' This is more text so that we can see what this might look like with a longer message that takes up a lot more space.'
  //     }
  //     className={css.notice}
  //     action={[
  //       <Button key={0} size="small" onClick={() => notices.read(notice.id)}>
  //         View
  //       </Button>,
  //     ]}
  //   />
  // )
}

const useStyles = makeStyles({
  notice: {
    backgroundColor: colors.primary,
    '& .MuiButton-root': { color: colors.white },
  },
})
