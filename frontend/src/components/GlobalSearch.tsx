import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import reactStringReplace from 'react-string-replace'
import escapeRegexp from 'escape-string-regexp'
import debounce from 'lodash.debounce'
import { sortSearch } from '../models/search'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { Box, TextField, Typography, ListItem, ListSubheader, Autocomplete, createFilterOptions, Theme } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { TargetPlatform } from './TargetPlatform'
import { useHistory } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { inputRef?: React.RefObject<HTMLInputElement>; onClose?: () => void }

const highlightSx = (theme: Theme) => ({
  borderRadius: '4px',
  backgroundColor: theme.palette.primaryLighter.main,
  color: theme.palette.black.main,
})

export const GlobalSearch: React.FC<Props> = ({ inputRef, onClose }) => {
  const { t } = useTranslation()
  const search = useSelector((state: State) => state.search.search)
  const userEmail = useSelector((state: State) => state.user.email)
  const fetching = useSelector((state: State) => state.search.fetching)
  const queryDefault = useSelector(selectDeviceModelAttributes).query
  const enabledIds = useSelector((state: State) => state.connections.all)
    .filter(c => c.enabled)
    .map(c => c.id)
  const data = sortSearch([...search])
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [query, setQuery] = useState<string>(queryDefault)

  const fetch = useMemo(
    () =>
      debounce(
        value => {
          console.log('FETCHING', value)
          dispatch.search.fetch(value)
        },
        400,
        { trailing: true }
      ),
    []
  )

  const clear = () => {
    setQuery('')
    dispatch.devices.set({ query: '', searched: false, from: 0 })
    dispatch.devices.fetchList()
  }

  const select = (selection: ISearch) => {
    // dispatch.devices.set({ query: '' })
    if (selection.nodeType === 'NETWORK') {
      dispatch.accounts.select(selection.accountId)
      history.push(`/networks/${selection?.nodeId}/${selection?.serviceId}`)
    } else {
      history.push(`/devices/${selection?.nodeId}/${selection?.serviceId}`)
    }
  }

  const submit = () => {
    console.log('SUBMIT', query)
    dispatch.devices.set({ query, searched: true, from: 0 })
    dispatch.devices.fetchList()
    onClose?.()
    history.push(`/devices`)
  }

  useEffect(() => {
    if (query) fetch(query)
  }, [query])

  return (
    <Box
      sx={theme => ({
        padding: 0,
        width: '100%',
        zIndex: 1,
        '& .MuiAutocomplete-listbox': {
          maxHeight: '60vh',
          backgroundColor: theme.palette.grayLightest.main,
          '& .MuiAutocomplete-option': {
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: 0,
            paddingLeft: `${spacing.xxs}px`,
            fontSize: fontSizes.base,
            color: theme.palette.grayDarker.main,
            '&[data-focus="true"]': { backgroundColor: theme.palette.primaryHighlight.main },
          },
        },
      })}
    >
      <Autocomplete
        // open // debug
        freeSolo
        fullWidth
        autoSelect
        autoComplete
        disablePortal
        includeInputInList
        clearOnBlur={false}
        clearOnEscape={false}
        blurOnSelect={true}
        inputValue={query || ''}
        options={data}
        loading={fetching}
        onChange={(_event, newValue: any | ISearch | null, reason: string) => {
          console.log('CHANGE', newValue, reason)
          if (reason === 'selectOption') select(newValue)
          if (reason === 'createOption') submit()
        }}
        groupBy={option => option.nodeId}
        onInputChange={(_event, newQuery, reason) => {
          if (reason === 'input') setQuery(newQuery)
          if (reason === 'clear') clear()
        }}
        onSubmit={submit}
        getOptionLabel={option => option.serviceName || option}
        isOptionEqualToValue={(option, value) => option.serviceId === value.serviceId}
        filterOptions={createFilterOptions({ stringify: option => option.combinedName })}
        clearIcon={
          <>
            {fetching && <Icon name="sync" size="sm" type="solid" spin fixedWidth inlineLeft />}
            <Icon name="times" size="md" fixedWidth />
          </>
        }
        renderInput={params => (
          <TextField
            {...params}
            autoFocus
            hiddenLabel
            placeholder={t('globalSearch.placeholder', 'Search device or service name')}
            variant="filled"
            inputRef={inputRef}
            sx={{
              WebkitAppRegion: 'no-drag',
              '& .MuiInputBase-root .MuiInputBase-input.MuiAutocomplete-input': {
                padding: `${spacing.sm}px`,
                fontSize: fontSizes.base,
              },
            }}
            onBlur={() => onClose?.()}
            onKeyDown={event => event.key === 'Enter' && !query && clear()}
            InputProps={{
              ...params.InputProps,
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
          />
        )}
        renderOption={(props, option: ISearch) => {
          const parts = reactStringReplace(
            option.serviceName,
            new RegExp(`(${escapeRegexp(query.trim())})`, 'i'),
            (match, i) => (
              <Box component="span" key={i} sx={highlightSx}>
                {match}
              </Box>
            )
          )
          const enabled = enabledIds.includes(option.serviceId)
          return (
            <ListItem {...props} key={props.id}>
              <Box
                component="span"
                sx={[
                  theme => ({
                    display: 'inline-block',
                    marginLeft: `${spacing.xs}px`,
                    padding: `${spacing.xs}px ${spacing.lg}px`,
                    borderLeft: `1px solid ${theme.palette.grayLight.main}`,
                  }),
                  enabled ? (theme: Theme) => ({ color: theme.palette.primary.main }) : {},
                ]}
                data-email={option.ownerEmail}
                data-platform={option.targetPlatform || option.nodeType}
                data-name={option.nodeName}
              >
                {parts}
              </Box>
            </ListItem>
          )
        }}
        renderGroup={option => {
          const props = option.children && option.children[0].props.children.props
          return [
            <ListSubheader
              disableGutters
              key={option.key}
              sx={theme => ({
                top: -8,
                display: 'flex',
                justifyContent: 'space-between',
                padding: `${spacing.sm}px ${spacing.md}px`,
                fontSize: fontSizes.base,
                color: theme.palette.grayDarkest.main,
                backgroundColor: theme.palette.grayLightest.main,
                width: '100%',
                borderRadius: 0,
                textTransform: 'inherit',
                letterSpacing: 'inherit',
                '& > p': { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 500 },
              })}
            >
              <Typography variant="body2">
                {props['data-platform'] === 'NETWORK' ? (
                  <Icon name="chart-network" color="grayDarker" inlineLeft size="md" />
                ) : (
                  <TargetPlatform id={props['data-platform']} inlineLeft size="md" />
                )}
                {reactStringReplace(
                  props['data-name'],
                  new RegExp(`(${escapeRegexp(query.trim())})`, 'i'),
                  (match, i) => (
                    <Box component="span" key={i} sx={highlightSx}>
                      {match}
                    </Box>
                  )
                )}
              </Typography>
              {userEmail !== props['data-email'] && <Typography variant="caption">{props['data-email']}</Typography>}
            </ListSubheader>,
            option.children,
          ]
        }}
      />
    </Box>
  )
}
