import { Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Container } from '../../components/Container'
import { GridList } from '../../components/GridList'
import { Gutters } from '../../components/Gutters'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { removeObject } from '../../helpers/utilHelper'
import { AdminDeviceSearchType } from '../../models/adminDevices'
import { Dispatch, State } from '../../store'
import { AdminDeviceListItem } from './AdminDeviceListItem'
import { adminDeviceAttributes } from './adminDeviceAttributes'

export const AdminDevicesListPage: React.FC = () => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [searchInput, setSearchInput] = useState('')
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminDeviceAttributes, a => a.required === true)

  const devices = useSelector((state: State) => state.adminDevices.devices)
  const total = useSelector((state: State) => state.adminDevices.total)
  const loading = useSelector((state: State) => state.adminDevices.loading)
  const hasMore = useSelector((state: State) => state.adminDevices.hasMore)
  const page = useSelector((state: State) => state.adminDevices.page)
  const searchValue = useSelector((state: State) => state.adminDevices.searchValue)
  const searchType = useSelector((state: State) => state.adminDevices.searchType)
  const searching = !!searchValue.trim()

  // Initialize search input from Redux state
  useEffect(() => {
    setSearchInput(searchValue)
  }, [])

  // Fetch on mount if empty
  useEffect(() => {
    dispatch.adminDevices.fetchIfEmpty(undefined)
  }, [])

  // Fetch when page/search changes (but not on initial mount)
  const isInitialMount = React.useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    dispatch.adminDevices.fetch(undefined)
  }, [page, searchValue, searchType])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      dispatch.adminDevices.setSearch({ searchValue: searchInput, searchType })
    }
  }

  const handleSearchTypeChange = (_: React.MouseEvent<HTMLElement>, newType: AdminDeviceSearchType | null) => {
    if (newType !== null) {
      dispatch.adminDevices.setSearch({ searchValue: searchInput, searchType: newType })
    }
  }

  const getPlaceholder = () => {
    switch (searchType) {
      case 'name':
        return 'Search by name prefix (fast)...'
      case 'contains':
        return 'Search names containing (full search, slower)...'
      case 'deviceId':
        return 'Search by device or hardware ID, exact or prefix...'
      case 'email':
        return 'Search by owner email...'
      case 'all':
      default:
        return 'Search by name, device ID, or owner email...'
    }
  }

  const handleDeviceClick = (ownerId?: string) => {
    if (!ownerId) return
    const route = `/admin/users/${ownerId}`
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
            <ToggleButtonGroup value={searchType} exclusive onChange={handleSearchTypeChange} size="small">
              <ToggleButton value="name" title="Name prefix — fast">
                Name
              </ToggleButton>
              <ToggleButton value="contains" title="Name contains — full search, slower">
                Contains
              </ToggleButton>
              <ToggleButton value="deviceId" title="Device or hardware ID, exact or prefix">
                ID
              </ToggleButton>
              <ToggleButton value="email" title="Owner email">
                Owner
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
            <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
              {searching ? `${devices.length}${hasMore ? '+' : ''} found` : `${total.toLocaleString()} devices`}
            </Typography>
          </Stack>
        </Gutters>
      }
    >
      {loading && devices.length === 0 ? (
        <LoadingMessage message="Loading devices..." />
      ) : devices.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="router" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            No devices found
          </Typography>
        </Box>
      ) : (
        <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading}>
          {devices.map(device => (
            <AdminDeviceListItem
              key={device.id}
              device={device}
              required={required}
              attributes={attributes}
              onClick={() => handleDeviceClick(device.owner?.id)}
            />
          ))}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Button color="primary" disabled={loading} onClick={() => dispatch.adminDevices.fetchMore(undefined)}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </GridList>
      )}
    </Container>
  )
}
