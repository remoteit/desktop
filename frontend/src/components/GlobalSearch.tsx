import React, { useEffect, useState } from 'react'
import reactStringReplace from 'react-string-replace'
import debounce from 'lodash.debounce'
import classnames from 'classnames'
import { getDeviceModel } from '../models/accounts'
import { selectAllSearch } from '../models/search'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { TextField, Typography, ListItem, ListSubheader, Autocomplete, createFilterOptions } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { TargetPlatform } from './TargetPlatform'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { inputRef?: React.RefObject<HTMLInputElement>; onClose?: () => void }

export const GlobalSearch: React.FC<Props> = ({ inputRef, onClose }) => {
  const { userEmail, enabledIds, fetching, queryDefault, data } = useSelector((state: ApplicationState) => ({
    userEmail: state.auth.user?.email,
    enabledIds: state.connections.all.filter(c => c.enabled).map(c => c.id),
    fetching: state.search.fetching,
    queryDefault: getDeviceModel(state).query,
    data: selectAllSearch(state),
  }))
  const css = useStyles()
  const history = useHistory()
  const { search, devices } = useDispatch<Dispatch>()
  const [query, setQuery] = useState<string>(queryDefault)

  const fetch = React.useMemo(
    () =>
      debounce(
        value => {
          console.log('FETCHING', value)
          search.fetch(value)
        },
        1000,
        { trailing: true }
      ),
    []
  )

  const clear = () => {
    setQuery('')
    devices.set({ query: '', searched: false, from: 0 })
    devices.fetch()
  }

  const select = (selection: ISearch) => {
    // devices.set({ query: '' })
    history.push(`/devices/${selection?.deviceId}/${selection?.serviceId}`)
  }

  const submit = () => {
    devices.set({ query, searched: true, from: 0 })
    devices.fetch()
    onClose && onClose()
    history.push(`/devices`)
  }

  useEffect(() => {
    if (query) fetch(query)
  }, [query])

  useEffect(
    () => () => {
      // on page exit
      console.log('UNLOAD', query)
      // devices.set({ query })
    },
    []
  )

  return (
    <div className={css.container}>
      <Autocomplete
        freeSolo
        fullWidth
        autoSelect
        openOnFocus
        autoComplete
        disablePortal
        includeInputInList
        clearOnBlur={false}
        clearOnEscape={false}
        blurOnSelect={true}
        inputValue={query || ''}
        options={data}
        loading={fetching}
        classes={{ option: css.option, listbox: css.listbox }}
        onChange={(event, newValue: any | ISearch | null, reason: string) => {
          if (reason === 'selectOption') select(newValue)
          if (reason === 'createOption') submit()
        }}
        groupBy={option => option.deviceName}
        onInputChange={(event, newQuery, reason) => {
          if (reason === 'input') setQuery(newQuery)
          if (reason === 'clear') clear()
        }}
        getOptionLabel={option => option.serviceName}
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
            label="Search"
            variant="filled"
            inputRef={inputRef}
            className={css.input}
            onBlur={() => onClose && onClose()}
            InputProps={{
              ...params.InputProps,
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
          />
        )}
        renderOption={(props, option: ISearch, state) => {
          const parts = reactStringReplace(option.serviceName, new RegExp(`(${query.trim()})`, 'i'), (match, i) => (
            <span key={i} className={css.highlight}>
              {match}
            </span>
          ))
          const enabled = enabledIds.includes(option.serviceId)
          // console.log('RENDER OPTION', props, option, state)
          return (
            <ListItem {...props} key={props.id}>
              <span
                className={classnames(enabled && css.enabled, option.offline && css.offline, css.indent)}
                data-email={option.ownerEmail}
                data-platform={option.targetPlatform}
                data-offline={option.offline.toString()}
                data-id={option.deviceId}
              >
                {parts}
              </span>
            </ListItem>
          )
        }}
        renderGroup={option => {
          const props = option.children && option.children[0].props.children.props
          console.log('RENDER GROUP', option.key, option.group)
          return [
            <ListSubheader disableGutters className={css.subhead} key={option.key}>
              <Typography variant="body2" className={props['data-offline'] === 'true' ? css.offline : undefined}>
                <TargetPlatform id={props['data-platform']} inlineLeft size="md" />
                {reactStringReplace(option.group, new RegExp(`(${query.trim()})`, 'i'), (match, i) => (
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
  input: { '-webkit-app-region': 'no-drag' },
  button: { marginBottom: -spacing.sm },
  enabled: { color: palette.primary.main },
  offline: { opacity: 0.3 },
  subhead: {
    top: -8,
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: fontSizes.base,
    color: palette.grayDarker.main,
    backgroundColor: palette.grayLightest.main,
    width: '100%',
    borderRadius: 0,
    textTransform: 'inherit',
    letterSpacing: 'inherit',
    '& > p': { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  },
  option: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: 0,
    paddingLeft: spacing.xxs,
    fontSize: fontSizes.base,
    color: palette.grayDarker.main,
    '&[data-focus="true"]': { backgroundColor: palette.primaryHighlight.main },
  },
  listbox: { maxHeight: '60vh', backgroundColor: palette.grayLightest.main },
  indent: {
    display: 'inline-block',
    marginLeft: spacing.lg,
    padding: `${spacing.xs}px ${spacing.lg}px`,
    borderLeft: `1px solid ${palette.grayLight.main}`,
  },
  highlight: {
    borderRadius: 4,
    backgroundColor: palette.primaryLighter.main,
    color: palette.black.main,
  },
}))
