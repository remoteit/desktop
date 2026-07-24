import React from 'react'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { Box, TextField, IconButton, Tooltip, Typography } from '@mui/material'
import { Dispatch, State } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

export const SearchField: React.FC = () => {
  const { total, results, query, searched, fetching, filter } = useSelector((state: State) =>
    selectDeviceModelAttributes(state)
  )
  const { devices } = useDispatch<Dispatch>()
  const { t } = useTranslation()

  // not compatible with DESK-648
  const disabled = Boolean(fetching || query.length < 2)

  const totalTitle = filter ? t('searchField.filtered', 'Filtered') : t('searchField.total', 'Total')
  const title = searched
    ? t('searchField.searchedOf', { totalTitle, defaultValue: 'Searched / {{totalTitle}}' })
    : t('searchField.totalDevices', { totalTitle, defaultValue: '{{totalTitle}} Devices' })

  return (
    <Box
      component="form"
      sx={{ width: '100%', display: 'flex', alignItems: 'center', position: 'relative' }}
      onSubmit={e => {
        e.preventDefault()
        devices.set({ searched: true, from: 0 })
        devices.fetchList()
      }}
    >
      <TextField
        fullWidth
        value={query}
        variant="filled"
        sx={{ marginRight: `${spacing.sm}px` }}
        onKeyPress={e => {
          if (e.key === 'Enter' && query.trim().length < 2) {
            devices.set({ query: '', searched: false, from: 0 })
            devices.fetchList()
          }
        }}
        onChange={e => devices.set({ query: e.target.value })}
        placeholder={t('searchField.placeholder', 'Search devices and services...')}
      />
      <Box sx={{ position: 'absolute', right: `${spacing.lg}px` }}>
        <Tooltip title={title}>
          <Typography sx={{ marginRight: `${spacing.sm}px` }} variant="caption">
            {searched ? `${results}/${total}` : total}
          </Typography>
        </Tooltip>
        {(searched || query) && (
          <Tooltip title={t('searchField.clearSearch', 'Clear search')}>
            <IconButton
              type="button"
              onClick={() => {
                devices.set({ query: '', searched: false, from: 0 })
                devices.fetchList()
              }}
              size="large"
            >
              <Icon name="times" size="md" color="grayDarker" fixedWidth />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={t('searchField.search', 'Search')}>
          <span>
            <IconButton type="submit" disabled={disabled} size="large">
              <Icon name="search" size="md" type="regular" color={disabled ? 'gray' : 'grayDarker'} fixedWidth />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}
