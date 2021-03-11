import React, { useEffect, useState } from 'react'
import debounce from 'lodash.debounce'
import reactStringReplace from 'react-string-replace'
import { selectAllSearch } from '../models/search'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { TextField, Typography, ListSubheader } from '@material-ui/core'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import { useHistory, useParams } from 'react-router-dom'
import { connectionName } from '../helpers/connectionHelper'
import { makeStyles } from '@material-ui/core/styles'
import { Title } from './Title'
import { Icon } from './Icon'
import { colors, spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const NewConnection: React.FC = () => {
  const { enabledIds, fetching, data } = useSelector((state: ApplicationState) => ({
    enabledIds: state.backend.connections.filter(c => c.enabled).map(c => c.id),
    fetching: state.search.fetching,
    data: selectAllSearch(state),
  }))
  const css = useStyles()
  const history = useHistory()
  const { search } = useDispatch<Dispatch>()
  const { serviceID } = useParams<{ serviceID?: string }>()
  const [value, setValue] = useState<ISearch | null>(null)
  const [inputValue, setInputValue] = useState<string>('')

  const fetch = React.useMemo(
    () =>
      debounce(value => {
        console.log('Debounce SEARCH', value)
        search.fetch(value)
      }, 400),
    []
  )

  useEffect(() => {
    analyticsHelper.track('newConnection')
  }, [])

  useEffect(() => {
    if (inputValue && !serviceID) fetch(inputValue)
  }, [inputValue])

  return (
    <>
      <Typography variant="subtitle1">
        <Title enabled={true}>New Connection</Title>
      </Typography>
      <div className={css.container}>
        <Autocomplete
          // debug
          fullWidth
          autoSelect
          autoComplete
          autoHighlight
          value={value}
          options={data}
          loading={fetching}
          // filterSelectedOptions
          classes={{ option: css.option }}
          onChange={(event, newValue: ISearch | null, reason) => {
            console.log('CHANGE reason:', reason, newValue)
            if (reason === 'select-option')
              history.push(`/connections/new/${newValue?.deviceId}/${newValue?.serviceId}`)
            setValue(newValue)
          }}
          groupBy={option => option.deviceName}
          defaultValue={data.find(d => d.serviceId === serviceID)}
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
          getOptionLabel={option => connectionName({ name: option.serviceName }, { name: option.deviceName })}
          getOptionSelected={(option, value) => option.serviceId === value.serviceId}
          filterOptions={createFilterOptions({ stringify: option => option.serviceName + ' ' + option.deviceName })}
          renderInput={params => (
            <TextField
              {...params}
              label="Select a service"
              size="small"
              variant="filled"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {fetching && <Icon className={css.loading} name="sync" type="regular" size="xs" spin fixedWidth />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={option => {
            const parts = reactStringReplace(option.serviceName, new RegExp(`(${inputValue})`, 'i'), (match, i) => (
              <span key={i} style={{ color: colors.primary }}>
                {match}
              </span>
            ))
            return enabledIds.includes(option.serviceId) ? <span className={css.enabled}>{parts}</span> : parts
          }}
          renderGroup={option => [
            <ListSubheader className="MuiAutocomplete-groupLabel" key={option.key}>
              {reactStringReplace(option.group, new RegExp(`(${inputValue})`, 'i'), (match, i) => (
                <span key={i} style={{ color: colors.primary }}>
                  {match}
                </span>
              ))}
              <span className={css.email}>{data[option.key].accountEmail}</span>
            </ListSubheader>,
            option.children,
          ]}
        />
      </div>
    </>
  )
}

const useStyles = makeStyles({
  container: {
    backgroundColor: colors.primaryLighter,
    borderRadius: spacing.sm,
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
    padding: spacing.md,
  },
  email: {
    float: 'right',
    color: colors.grayLight,
    textTransform: 'none',
    letterSpacing: 0,
  },
  enabled: { color: colors.primary },
  option: { display: 'block' },
  loading: { color: colors.grayDarker, position: 'absolute', right: 70, top: 0, height: '100%' },
})
