import React, { useEffect, useState, useMemo } from 'react'
import reactStringReplace from 'react-string-replace'
import escapeRegexp from 'escape-string-regexp'
import debounce from 'lodash.debounce'
import classnames from 'classnames'
import { sortSearch } from '../models/search'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { TextField, Typography, ListItem, ListSubheader, Autocomplete, createFilterOptions } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { TargetPlatform } from './TargetPlatform'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { inputRef?: React.RefObject<HTMLInputElement>; onClose?: () => void }

export const GlobalSearch: React.FC<Props> = ({ inputRef, onClose }) => {
  const search = useSelector((state: State) => state.search.search)
  const userEmail = useSelector((state: State) => state.user.email)
  const fetching = useSelector((state: State) => state.search.fetching)
  const queryDefault = useSelector(selectDeviceModelAttributes).query
  const enabledIds = useSelector((state: State) => state.connections.all)
    .filter(c => c.enabled)
    .map(c => c.id)
  const data = sortSearch([...search])
  const css = useStyles()
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
    <div className={css.container}>
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
        classes={{ listbox: css.listbox }}
        onChange={(event, newValue: any | ISearch | null, reason: string) => {
          console.log('change', newValue, reason)
          if (reason === 'selectOption') select(newValue)
          if (reason === 'createOption') submit()
        }}
        groupBy={option => option.nodeName}
        onInputChange={(event, newQuery, reason) => {
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
            placeholder="Search device or service name"
            variant="filled"
            inputRef={inputRef}
            className={css.input}
            onBlur={() => onClose?.()}
            onKeyDown={event => event.key === 'Enter' && !query && clear()}
            InputProps={{
              ...params.InputProps,
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
          />
        )}
        renderOption={(props, option: ISearch, state) => {
          const parts = reactStringReplace(
            option.serviceName,
            new RegExp(`(${escapeRegexp(query.trim())})`, 'i'),
            (match, i) => (
              <span key={i} className={css.highlight}>
                {match}
              </span>
            )
          )
          const enabled = enabledIds.includes(option.serviceId)
          // console.log('RENDER OPTION', props, option, state)
          return (
            <ListItem {...props} key={props.id}>
              <span
                className={classnames(enabled && css.enabled, css.indent)}
                data-email={option.ownerEmail}
                data-platform={option.targetPlatform || option.nodeType}
                data-id={option.nodeId}
              >
                {parts}
              </span>
            </ListItem>
          )
        }}
        renderGroup={option => {
          const props = option.children && option.children[0].props.children.props

          return [
            <ListSubheader disableGutters className={css.subhead} key={option.key}>
              <Typography variant="body2">
                {props['data-platform'] === 'NETWORK' ? (
                  <Icon name="chart-network" color="grayDarker" inlineLeft size="md" />
                ) : (
                  <TargetPlatform id={props['data-platform']} inlineLeft size="md" />
                )}
                {reactStringReplace(option.group, new RegExp(`(${escapeRegexp(query.trim())})`, 'i'), (match, i) => (
                  <span key={i} className={css.highlight}>
                    {match}
                  </span>
                ))}
              </Typography>
              {userEmail !== props['data-email'] && <Typography variant="caption">{props['data-email']}</Typography>}
            </ListSubheader>,
            option.children,
          ]
        }}
      />
    </div>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    padding: 0,
    width: '100%',
    zIndex: 1,
  },
  input: {
    WebkitAppRegion: 'no-drag',
    '& .MuiInputBase-root .MuiInputBase-input.MuiAutocomplete-input': {
      padding: `${spacing.sm}px`,
      fontSize: fontSizes.base,
    },
  },
  button: { marginBottom: -spacing.sm },
  enabled: { color: palette.primary.main },
  subhead: {
    top: -8,
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: fontSizes.base,
    color: palette.grayDarkest.main,
    backgroundColor: palette.grayLightest.main,
    width: '100%',
    borderRadius: 0,
    textTransform: 'inherit',
    letterSpacing: 'inherit',
    '& > p': { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 500 },
  },
  listbox: {
    maxHeight: '60vh',
    backgroundColor: palette.grayLightest.main,
    '& .MuiAutocomplete-option': {
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: 0,
      paddingLeft: spacing.xxs,
      fontSize: fontSizes.base,
      color: palette.grayDarker.main,
      '&[data-focus="true"]': { backgroundColor: palette.primaryHighlight.main },
    },
  },
  indent: {
    display: 'inline-block',
    marginLeft: spacing.xs,
    padding: `${spacing.xs}px ${spacing.lg}px`,
    borderLeft: `1px solid ${palette.grayLight.main}`,
  },
  highlight: {
    borderRadius: 4,
    backgroundColor: palette.primaryLighter.main,
    color: palette.black.main,
  },
}))
