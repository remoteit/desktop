import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { List, Pagination, Slider, Box } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { AccordionMenuItem } from './AccordionMenuItem'
import { UserListItem } from './UserListItem'
import { ShareDetails } from './ShareDetails'
import { IconButton } from '../buttons/IconButton'

interface Props {
  title: string
  device?: IDevice
  remove?: string
  users?: IUser[]
  members?: boolean
  connected?: boolean
  perPage?: number
}

export const SharedUsersPaginatedList: React.FC<Props> = ({
  title,
  device,
  remove,
  users = [],
  members,
  connected,
  perPage = 12,
}) => {
  const [page, setPage] = useState<number>(1)
  const css = useStyles()

  if (!users?.length) return null

  const pageCount = Math.ceil(users.length / perPage)
  const start = (page - 1) * perPage
  const pageUsers = users.slice(start, start + perPage)

  return (
    <AccordionMenuItem
      gutters
      subtitle={title}
      action={
        <Box className={css.pagination}>
          {users.length > perPage * 3 ? (
            <>
              <IconButton name="chevron-left" type="solid" color="primary" onClick={() => setPage(page - 1)} />
              <Slider
                valueLabelDisplay="auto"
                valueLabelFormat={value => pageUsers[0]?.email?.substring(0, 1) || '-'}
                defaultValue={page}
                max={pageCount}
                onChange={(e, page) => setPage(Number(page))}
                size="small"
              />
              <IconButton name="chevron-right" type="solid" color="primary" onClick={() => setPage(page + 1)} />
            </>
          ) : (
            users.length > perPage && (
              <Pagination
                classes={{ ul: css.pagination }}
                count={pageCount}
                onChange={(e, page) => setPage(Math.max(page, 1))}
                size="small"
              />
            )
          )}
        </Box>
      }
      defaultExpanded
    >
      <List>
        {pageUsers.map((user, i) => (
          <UserListItem key={user.id} user={user} isConnected={connected} member={members} remove={remove}>
            <ShareDetails user={user} device={device} connected />
          </UserListItem>
        ))}
      </List>
    </AccordionMenuItem>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  pagination: {
    margin: 0,
    whiteSpace: 'nowrap',
    flexWrap: 'nowrap',
    '& .MuiSlider-sizeSmall': { width: 200 },
    '& .MuiIconButton-root': { marginTop: -spacing.lg },
    '& .MuiPaginationItem-sizeSmall': { fontSize: fontSizes.xxs },
    '& .MuiPaginationItem-page.Mui-selected': {
      backgroundColor: palette.primary.main,
      color: palette.alwaysWhite.main,
      fontWeight: 500,
    },
  },
  center: { display: 'flex', justifyContent: 'center' },
}))
