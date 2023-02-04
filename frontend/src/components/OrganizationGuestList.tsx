import React, { useState, useEffect } from 'react'
import { useStyles } from './SharedUsersPaginatedList'
import { Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { List, ListSubheader, ListItemSecondaryAction, Box, Chip } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { selectOrganization } from '../selectors/organizations'
import { LoadingMessage } from './LoadingMessage'
import { Pagination } from '@mui/lab'
import { Gutters } from './Gutters'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export const OrganizationGuestList: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const [page, setPage] = useState<number>(1)
  const { guests, guestsLoaded } = useSelector(selectOrganization)
  const perPage = 20
  const pageCount = Math.ceil(guests.length / perPage)
  const start = (page - 1) * perPage
  const pageGuests = [...guests].sort(alphaEmailSort).slice(start, start + perPage)

  useEffect(() => {
    if (!guestsLoaded) dispatch.organization.fetchGuests()
  }, [guests])

  if (!guestsLoaded) return <LoadingMessage />

  return (
    <>
      <List>
        <ListSubheader>
          Guest
          <ListItemSecondaryAction>Shares</ListItemSecondaryAction>
        </ListSubheader>
        {pageGuests.map(guest => (
          <ListItemLocation
            dense
            key={guest.id}
            title={guest.email}
            pathname={`/organization/guests/${guest.id}`}
            icon={<Avatar email={guest.email} size={26} />}
          >
            <ListItemSecondaryAction>
              {!!guest.networkIds.length && (
                <Chip
                  size="small"
                  label={
                    <Box display="flex">
                      <Icon name="chart-network" size="sm" color="grayDarker" inlineLeft />
                      {guest.networkIds.length}
                    </Box>
                  }
                />
              )}
              {!!guest.deviceIds.length && (
                <Chip
                  size="small"
                  label={
                    <Box display="flex">
                      <Icon name="router" size="base" color="grayDarker" inlineLeft />
                      {guest.deviceIds.length}
                    </Box>
                  }
                />
              )}
            </ListItemSecondaryAction>
          </ListItemLocation>
        ))}
      </List>
      {guests.length > perPage && (
        <Gutters className={css.center}>
          <Pagination className={css.pagination} count={pageCount} onChange={(e, page) => setPage(page)} size="small" />
        </Gutters>
      )}
    </>
  )
}

function alphaEmailSort(a, b) {
  const aa = a.email.toLowerCase()
  const bb = b.email.toLowerCase()
  return aa > bb ? 1 : aa < bb ? -1 : 0
}
