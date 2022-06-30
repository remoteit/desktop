import React, { useEffect, useState } from 'react'
import reactStringReplace from 'react-string-replace'
import debounce from 'lodash.debounce'
import classnames from 'classnames'
import { getDeviceModel } from '../models/accounts'
import { selectAllSearch } from '../models/search'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { TextField, Typography, ListSubheader, ButtonBase } from '@material-ui/core'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import { spacing, fontSizes } from '../styling'
import { connectionName } from '../helpers/connectionHelper'
import { TargetPlatform } from './TargetPlatform'
import { makeStyles } from '@material-ui/core/styles'
import { useHistory } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { inputRef?: React.RefObject<HTMLInputElement>; onClose?: () => void }

export const GlobalSearch: React.FC<Props> = ({ inputRef, onClose }) => {
  const { userEmail, enabledIds, fetching, query, data } = useSelector((state: ApplicationState) => ({
    userEmail: state.auth.user?.email,
    enabledIds: state.connections.all.filter(c => c.enabled).map(c => c.id),
    fetching: state.search.fetching,
    query: getDeviceModel(state).query,
    data: selectAllSearch(state),
  }))
  const css = useStyles()
  const history = useHistory()
  const { search, devices } = useDispatch<Dispatch>()
  const [value, setValue] = useState<ISearch | null>(null)

  const fetch = React.useMemo(
    () =>
      debounce(
        value => {
          search.fetch(value)
        },
        800,
        { trailing: true }
      ),
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
        freeSolo
        fullWidth
        autoSelect
        openOnFocus
        autoComplete
        clearOnBlur={false}
        clearOnEscape={false}
        blurOnSelect={true}
        value={value}
        inputValue={query || ''}
        options={data}
        loading={fetching}
        classes={{ option: css.option, listbox: css.listbox }}
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
            className={css.input}
            onBlur={() => onClose && onClose()}
            InputProps={{
              ...params.InputProps,
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
          />
        )}
        renderOption={(option: ISearch) => {
          const parts = reactStringReplace(option.serviceName, new RegExp(`(${query.trim()})`, 'i'), (match, i) => (
            <span key={i} className={css.highlight}>
              {match}
            </span>
          ))
          const enabled = enabledIds.includes(option.serviceId)
          return (
            <span
              className={classnames(enabled && css.enabled, option.offline && css.offline, css.indent)}
              data-email={option.ownerEmail}
              data-platform={option.targetPlatform}
              data-offline={option.offline.toString()}
              data-id={option.deviceId}
            >
              {parts}
            </span>
          )
        }}
        renderGroup={option => {
          const props = option.children && option.children[0].props.children.props
          return [
            <ListSubheader disableGutters className={css.subhead} key={option.key}>
              <ButtonBase
                className={css.group}
                onClick={() => {
                  history.push(`/devices/${props['data-id']}`)
                  inputRef?.current?.blur()
                }}
              >
                <Typography variant="body2" className={props['data-offline'] === 'true' ? css.offline : undefined}>
                  <TargetPlatform id={props['data-platform']} inlineLeft size="md" />
                  {reactStringReplace(option.group, new RegExp(`(${query.trim()})`, 'i'), (match, i) => (
                    <span key={i} className={css.highlight}>
                      {match}
                    </span>
                  ))}
                </Typography>
                {userEmail !== props['data-email'] && <Typography variant="caption">{props['data-email']}</Typography>}
              </ButtonBase>
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
    '-webkit-app-region': 'no-drag',
    '& .MuiFilledInput-root': { padding: 0 },
    '& .MuiFilledInput-input': { padding: '22px 12px 10px !important' },
  },
  button: { marginBottom: -spacing.sm },
  enabled: { color: palette.primary.main },
  offline: { opacity: 0.3 },
  subhead: { padding: 0, top: -8 },
  group: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: fontSizes.base,
    color: palette.grayDarker.main,
    backgroundColor: palette.grayLightest.main,
    width: '100%',
    borderRadius: 0,
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
