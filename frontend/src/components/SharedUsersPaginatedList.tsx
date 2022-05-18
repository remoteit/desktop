import React, { useState } from 'react'
import { makeStyles, List, Typography } from '@material-ui/core'
import { Pagination } from '@material-ui/lab'
import { UserListItem } from './UserListItem'
import { ShareDetails } from './ShareDetails'
import { Title } from './Title'
import { fontSizes } from '../styling'

interface Props {
  title: string
  device?: IDevice
  users?: IUser[]
  connected?: boolean
  perPage?: number
}

export const SharedUsersPaginatedList: React.FC<Props> = ({ title, device, users = [], connected, perPage = 12 }) => {
  const [page, setPage] = useState<number>(1)
  const css = useStyles()

  if (!users?.length) return null

  const pageCount = Math.ceil(users.length / perPage)
  const start = (page - 1) * perPage
  const pageUsers = users.slice(start, start + perPage)

  return (
    <>
      <Typography variant="subtitle1" color={connected ? 'primary' : undefined}>
        <Title>{title}</Title>
        {users.length > perPage && (
          <Pagination className={css.pagination} count={pageCount} onChange={(e, page) => setPage(page)} size="small" />
        )}
      </Typography>
      <List>
        {pageUsers.map((user, i) => (
          <UserListItem key={user.email + i} user={user} isConnected={connected}>
            <ShareDetails user={user} device={device} connected />
          </UserListItem>
        ))}
      </List>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  pagination: {
    margin: 0,
    '& .MuiPaginationItem-sizeSmall': { fontSize: fontSizes.xxs },
    '& .MuiPaginationItem-page.Mui-selected': {
      backgroundColor: palette.primary.main,
      color: palette.alwaysWhite.main,
      fontWeight: 500,
    },
  },
}))
