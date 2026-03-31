import { Box, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { Gutters } from '../../components/Gutters'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { removeObject } from '../../helpers/utilHelper'
import { State } from '../../store'
import { AdminAdminListItem } from './AdminAdminListItem'
import { AddAdminDialog } from '../AdminUsersPage/AddAdminDialog'
import { adminAdminAttributes, AdminAdminRow } from './adminAdminAttributes'
import { graphQLAdminUsers } from '../../services/graphQLRequest'

type SearchType = 'all' | 'email' | 'userId'

export const AdminAdminsListPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminAdminAttributes, a => a.required === true)

  const [admins, setAdmins] = useState<AdminAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('email')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const searchInputRef = useRef(searchInput)
  const searchTypeRef = useRef(searchType)
  searchInputRef.current = searchInput
  searchTypeRef.current = searchType

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const filters: { admin: boolean; email?: string; accountId?: string; search?: string } = { admin: true }
      const trimmed = searchInputRef.current.trim()
      if (trimmed) {
        switch (searchTypeRef.current) {
          case 'email':
            filters.email = trimmed
            break
          case 'userId':
            filters.accountId = trimmed
            break
          case 'all':
            filters.search = trimmed
            break
        }
      }
      const result = await graphQLAdminUsers({ from: 0, size: 100 }, filters, 'email')
      if (result !== 'ERROR' && result?.data?.data?.admin?.users) {
        setAdmins(result.data.data.admin.users.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  useEffect(() => {
    const handler = () => fetchAdmins()
    window.addEventListener('refreshAdminData', handler)
    return () => window.removeEventListener('refreshAdminData', handler)
  }, [fetchAdmins])

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      fetchAdmins()
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

  const handleAdminClick = (adminId: string) => {
    history.push(`/admin/admins/${adminId}`)
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
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              size="small"
              InputProps={{
                startAdornment: <Icon name="search" size="sm" color="grayDark" inlineLeft />,
              }}
            />
            <IconButton
              icon="user-plus"
              title="Add Admin"
              onClick={() => setAddDialogOpen(true)}
              size="md"
              color="primary"
            />
          </Stack>
        </Gutters>
      }
    >
      {loading ? (
        <LoadingMessage message="Loading admins..." />
      ) : admins.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="shield" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            No admins found
          </Typography>
        </Box>
      ) : (
        <GridList
          attributes={attributes}
          required={required}
          columnWidths={columnWidths}
          fetching={loading}
        >
          {admins.map(admin => (
            <AdminAdminListItem
              key={admin.id}
              admin={admin}
              required={required}
              attributes={attributes}
              active={location.pathname.includes(`/admin/admins/${admin.id}`)}
              onClick={() => handleAdminClick(admin.id)}
            />
          ))}
        </GridList>
      )}

      <AddAdminDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => fetchAdmins()}
      />
    </Container>
  )
}
