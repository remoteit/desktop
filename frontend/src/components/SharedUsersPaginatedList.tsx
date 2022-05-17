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
}

const PER_PAGE = 12

export const SharedUsersPaginatedList: React.FC<Props> = ({ title, device, users = [], connected }) => {
  const [page, setPage] = useState<number>(1)
  const css = useStyles()

  if (!users?.length) return null

  const pageCount = Math.ceil(users.length / PER_PAGE)
  const start = (page - 1) * PER_PAGE
  const pageUsers = users.slice(start, start + PER_PAGE)

  return (
    <>
      <Typography variant="subtitle1" color={connected ? 'primary' : undefined}>
        <Title>{title}</Title>
        {users.length > PER_PAGE && (
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
