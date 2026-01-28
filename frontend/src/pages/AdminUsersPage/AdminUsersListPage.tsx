import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, Box, TextField, ToggleButtonGroup, ToggleButton, Stack } from '@mui/material'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { graphQLAdminUsers } from '../../services/graphQLRequest'
import { Gutters } from '../../components/Gutters'
import { GridList } from '../../components/GridList'
import { AdminUserListItem } from './AdminUserListItem'
import { adminUserAttributes } from './adminUserAttributes'
import { removeObject } from '../../helpers/utilHelper'
import { State, Dispatch } from '../../store'

type SearchType = 'all' | 'email' | 'userId'

export const AdminUsersListPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const [searchInput, setSearchInput] = useState('')
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminUserAttributes, a => a.required === true)

  // Get state from Redux
  const users = useSelector((state: State) => state.adminUsers.users)
  const loading = useSelector((state: State) => state.adminUsers.loading)
  const total = useSelector((state: State) => state.adminUsers.total)
  const page = useSelector((state: State) => state.adminUsers.page)
  const pageSize = useSelector((state: State) => state.adminUsers.pageSize)
  const searchValue = useSelector((state: State) => state.adminUsers.searchValue)
  const searchType = useSelector((state: State) => state.adminUsers.searchType)

  // Initialize search input from Redux state
  useEffect(() => {
    setSearchInput(searchValue)
  }, [])

  // Fetch on mount if empty
  useEffect(() => {
    dispatch.adminUsers.fetchIfEmpty()
  }, [])

  // Fetch when page/search changes (but not on initial mount)
  const isInitialMount = React.useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    dispatch.adminUsers.fetch()
  }, [page, searchValue, searchType])

  useEffect(() => {
    const handleRefresh = () => {
      dispatch.adminUsers.fetch()
    }
    window.addEventListener('refreshAdminData', handleRefresh)
    return () => window.removeEventListener('refreshAdminData', handleRefresh)
  }, [])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      dispatch.adminUsers.setSearch({ searchValue: searchInput, searchType })
    }
  }

  const handleSearchTypeChange = (_: React.MouseEvent<HTMLElement>, newType: SearchType | null) => {
    if (newType !== null) {
      dispatch.adminUsers.setSearch({ searchValue, searchType: newType })
    }
  }

  const getPlaceholder = () => {
    switch (searchType) {
      case 'email':
        return 'Search by email address...'
      case 'userId':
        return 'Search by user ID (UUID)...'
      case 'all':
      default:
        return 'Search by email, name, or user ID...'
    }
  }

  const handleUserClick = (userId: string) => {
    const route = `/admin/users/${userId}/account`
    dispatch.ui.setDefaultSelected({ key: '/admin/users', value: route, accountId: 'admin' })
    history.push(route)
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={searchType}
              exclusive
              onChange={handleSearchTypeChange}
              size="small"
            >
              <ToggleButton value="email" title="Search by email">
                <Icon name="envelope" size="sm" />
              </ToggleButton>
              <ToggleButton value="userId" title="Search by user ID">
                <Icon name="fingerprint" size="sm" />
              </ToggleButton>
              <ToggleButton value="all" title="Search all fields">
                <Icon name="search" size="sm" />
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              fullWidth
              placeholder={getPlaceholder()}
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              size="small"
              InputProps={{
                startAdornment: <Icon name="search" size="sm" color="grayDark" inlineLeft />,
              }}
            />
          </Stack>
        </Gutters>
      }
    >
      {loading ? (
        <LoadingMessage message="Loading users..." />
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="users" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            No users found
          </Typography>
        </Box>
      ) : (
        <GridList
          attributes={attributes}
          required={required}
          columnWidths={columnWidths}
          fetching={loading}
        >
          {users.map(user => (
            <AdminUserListItem
              key={user.id}
              user={user}
              required={required}
              attributes={attributes}
              active={location.pathname.includes(`/admin/users/${user.id}`)}
              onClick={() => handleUserClick(user.id)}
            />
          ))}
        </GridList>
      )}
    </Container>
  )
}

