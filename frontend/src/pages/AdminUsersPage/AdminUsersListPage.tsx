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
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('email')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminUserAttributes, a => a.required === true)

  useEffect(() => {
    fetchUsers()
  }, [page, searchValue, searchType])

  const fetchUsers = async () => {
    setLoading(true)
    
    // Build filters based on search type
    const filters: { search?: string; email?: string; accountId?: string } = {}
    const trimmedValue = searchValue.trim()
    
    if (trimmedValue) {
      switch (searchType) {
        case 'email':
          filters.email = trimmedValue
          break
        case 'userId':
          filters.accountId = trimmedValue
          break
        case 'all':
        default:
          filters.search = trimmedValue
          break
      }
    }
    
    const result = await graphQLAdminUsers(
      { from: (page - 1) * pageSize, size: pageSize },
      Object.keys(filters).length > 0 ? filters : undefined,
      'email'
    )
    if (result !== 'ERROR' && result?.data?.data?.admin?.users) {
      const data = result.data.data.admin.users
      setUsers(data.items || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setSearchValue(searchInput)
      setPage(1)
    }
  }

  const handleSearchTypeChange = (_: React.MouseEvent<HTMLElement>, newType: SearchType | null) => {
    if (newType !== null) {
      setSearchType(newType)
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
    dispatch.ui.setDefaultSelected({ key: '/admin/users', value: `/admin/users/${userId}` })
    history.push(`/admin/users/${userId}`)
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                icon="sync"
                title="Refresh"
                onClick={fetchUsers}
                spin={loading}
                size="md"
              />
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

