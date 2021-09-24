import React, { useEffect, useState } from 'react'
import debounce from 'lodash.debounce'
import reactStringReplace from 'react-string-replace'
import { selectAllSearch } from '../models/search'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { TextField, ListSubheader } from '@material-ui/core'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import { useHistory, useParams } from 'react-router-dom'
import { connectionName } from '../helpers/connectionHelper'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from './Icon'
import { colors, spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = { inputRef?: React.RefObject<HTMLInputElement>; onClose?: () => void }

export const GlobalSearch: React.FC<Props> = ({ inputRef, onClose }) => {
  const { enabledIds, fetching, query, data } = useSelector((state: ApplicationState) => ({
    enabledIds: state.connections.all.filter(c => c.enabled).map(c => c.id),
    fetching: state.search.fetching,
    query: state.devices.query,
    data: selectAllSearch(state),
  }))
  const css = useStyles()
  const history = useHistory()
  const { search, devices } = useDispatch<Dispatch>()
  const { serviceID } = useParams<{ serviceID?: string }>()
  const [value, setValue] = useState<ISearch | null>(null)

  const fetch = React.useMemo(
    () =>
      debounce(value => {
        search.fetch(value)
      }, 400),
    []
  )

  const change = newQuery => {
    devices.set({ query: newQuery })
  }

  const clear = () => {
    devices.set({ query: '', searched: false, from: 0 })
    devices.fetch()
  }

  const select = (selection: ISearch) => {
    console.log('SELECT', selection)
    setValue(selection)
    devices.set({ query: '' })
    history.push(`/devices/${selection?.deviceId}/${selection?.serviceId}`)
  }

  const submit = () => {
    history.push(`/devices`)
    devices.set({ searched: true, from: 0 })
    devices.fetch()
  }

  useEffect(() => {
    analyticsHelper.track('newConnection')
    console.log('SERVICE ID', serviceID)
    if (serviceID) setValue(data.find(d => d.serviceId === serviceID) || null)
  }, [])

  useEffect(() => {
    if (query && !serviceID) fetch(query)
  }, [query])

  return (
    <div className={css.container}>
      <Autocomplete
        // debug
        freeSolo
        fullWidth
        autoSelect
        autoComplete
        size="small"
        clearOnBlur={false}
        clearOnEscape={false}
        blurOnSelect={true}
        value={value}
        inputValue={query || ''}
        options={data}
        loading={fetching}
        classes={{ option: css.option }}
        onClose={(event, reason: string) => {
          console.log('AUTOCOMPLETE CLOSE EVENT', reason, value?.serviceId)
        }}
        onChange={(event, newValue: any | ISearch | null, reason: string) => {
          console.log('AUTOCOMPLETE CHANGE EVENT', reason, newValue)
          if (reason === 'select-option') select(newValue)
          if (reason === 'create-option') submit()
        }}
        groupBy={option => option.deviceName}
        onInputChange={(event, newQuery, reason) => {
          console.log('INPUT CHANGE EVENT', reason, newQuery)
          if (reason === 'input') change(newQuery)
          if (reason === 'clear') clear()
        }}
        getOptionLabel={option => connectionName({ name: option.serviceName }, { name: option.deviceName })}
        getOptionSelected={(option, value) => option.serviceId === value.serviceId}
        filterOptions={createFilterOptions({ stringify: option => option.serviceName + ' ' + option.deviceName })}
        closeIcon={
          <>
            {fetching && <Icon name="sync" size="sm" type="solid" spin fixedWidth inlineLeft />}
            <Icon name="times" size="md" fixedWidth />
          </>
        }
        renderInput={params => (
          <TextField
            {...params}
            label="Search"
            variant="filled"
            inputRef={inputRef}
            onBlur={() => onClose && onClose()}
            InputProps={{
              ...params.InputProps,
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
          />
        )}
        renderOption={option => {
          const parts = reactStringReplace(option.serviceName, new RegExp(`(${query})`, 'i'), (match, i) => (
            <span key={i} style={{ fontWeight: 500, color: colors.success }}>
              {match}
            </span>
          ))
          return enabledIds.includes(option.serviceId) ? <span className={css.enabled}>{parts}</span> : parts
        }}
        renderGroup={option => [
          <ListSubheader className="MuiAutocomplete-groupLabel" key={option.key}>
            {reactStringReplace(option.group, new RegExp(`(${query})`, 'i'), (match, i) => (
              <span key={i} style={{ fontWeight: 500, color: colors.success }}>
                {match}
              </span>
            ))}
            <span className={css.email}>{data[option.key].accountEmail}</span>
          </ListSubheader>,
          option.children,
        ]}
      />
    </div>
  )
}

const useStyles = makeStyles({
  container: {
    padding: 0,
    width: '100%',
    zIndex: 1,
  },
  email: {
    float: 'right',
    color: colors.gray,
    textTransform: 'none',
    letterSpacing: 0,
  },
  button: { marginBottom: -spacing.sm },
  enabled: { color: colors.primary },
  option: { display: 'block', marginLeft: spacing.md },
})
