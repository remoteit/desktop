import React, { useEffect, useState } from 'react'
import reactStringReplace from 'react-string-replace'
import debounce from 'lodash.debounce'
import classnames from 'classnames'
import { selectAllSearch } from '../models/search'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { TextField, ListSubheader } from '@material-ui/core'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import { colors, spacing } from '../styling'
import { connectionName } from '../helpers/connectionHelper'
import { makeStyles } from '@material-ui/core/styles'
import { useHistory } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { inputRef?: React.RefObject<HTMLInputElement>; onClose?: () => void }

export const GlobalSearch: React.FC<Props> = ({ inputRef, onClose }) => {
  const { showAccount, enabledIds, fetching, query, data } = useSelector((state: ApplicationState) => ({
    showAccount: !!state.accounts.member.length,
    enabledIds: state.connections.all.filter(c => c.enabled).map(c => c.id),
    fetching: state.search.fetching,
    query: state.devices.query,
    data: selectAllSearch(state),
  }))
  const css = useStyles()
  const history = useHistory()
  const { search, devices } = useDispatch<Dispatch>()
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
    if (query) fetch(query)
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
        onChange={(event, newValue: any | ISearch | null, reason: string) => {
          if (reason === 'select-option') select(newValue)
          if (reason === 'create-option') submit()
        }}
        groupBy={option => option.deviceName}
        onInputChange={(event, newQuery, reason) => {
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
        renderOption={(option: ISearch) => {
          const parts = reactStringReplace(option.serviceName, new RegExp(`(${query})`, 'i'), (match, i) => (
            <span key={i} className={css.highlight}>
              {match}
            </span>
          ))
          const enabled = enabledIds.includes(option.serviceId)
          return (
            <span
              className={classnames(enabled && css.enabled, option.offline && css.offline)}
              data-email={option.accountEmail}
            >
              {parts}
            </span>
          )
        }}
        renderGroup={option => [
          <ListSubheader disableGutters className={css.group + ' MuiAutocomplete-groupLabel'} key={option.key}>
            <span>
              {reactStringReplace(option.group, new RegExp(`(${query})`, 'i'), (match, i) => (
                <span key={i} className={css.highlight}>
                  {match}
                </span>
              ))}
            </span>
            {showAccount && (
              <span className={css.email}>
                {option.children && option.children[0].props.children.props['data-email']}
              </span>
            )}
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
    color: colors.gray,
    textTransform: 'none',
    letterSpacing: 0,
  },
  button: { marginBottom: -spacing.sm },
  enabled: { color: colors.primary },
  offline: { opacity: 0.3 },
  group: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${spacing.md}px`,
    '& > span': { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  },
  option: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' },
  highlight: {
    backgroundColor: colors.primaryLighter,
    color: colors.black,
    borderRadius: 4,
  },
})
