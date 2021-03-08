import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { TextField, Typography, ListSubheader } from '@material-ui/core'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import { useHistory, useParams } from 'react-router-dom'
import { connectionName } from '../helpers/connectionHelper'
import { makeStyles } from '@material-ui/core/styles'
import { getAllDevices } from '../models/accounts'
import { Title } from './Title'
import styles from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const NewConnection: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { search } = useDispatch<Dispatch>()
  const { serviceID } = useParams<{ serviceID?: string }>()
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ISearch[]>([])
  const { data, enabledIds } = useSelector((state: ApplicationState) => ({
    enabledIds: state.backend.connections.filter(c => c.enabled).map(c => c.id),
    data: state.search.all,
  }))

  useEffect(() => {
    analyticsHelper.track('newConnection')
    search.fetch('')
    // if (!open) setOptions([])
  }, [])

  return (
    <>
      <Typography variant="subtitle1">
        <Title enabled={true}>New Connection</Title>
      </Typography>
      <div className={css.container}>
        <Autocomplete
          // debug
          autoHighlight
          autoComplete
          autoSelect
          defaultValue={data.find(d => d.serviceId === serviceID)}
          options={data}
          groupBy={option => option.deviceName}
          // getOptionDisabled={option => option.state === 'inactive'}
          getOptionLabel={option => connectionName({ name: option.serviceName }, { name: option.deviceName })}
          getOptionSelected={(option, value) => option.serviceId === value.serviceId}
          filterOptions={createFilterOptions({ stringify: option => option.serviceName + ' ' + option.deviceName })}
          renderInput={params => <TextField {...params} label="Select a service" size="small" variant="filled" />}
          renderOption={option =>
            enabledIds.includes(option.serviceId) ? (
              <span className={css.enabled}>{option.serviceName}</span>
            ) : (
              option.serviceName
            )
          }
          renderGroup={option => [
            <ListSubheader className="MuiAutocomplete-groupLabel" key={option.key}>
              {option.group}
              <span className={css.email}>{data[option.key].accountEmail}</span>
            </ListSubheader>,
            option.children,
          ]}
          onChange={(event, value, reason) => {
            if (reason === 'select-option') history.push(`/connections/new/${value?.serviceId}`)
          }}
          fullWidth
        />
      </div>
    </>
  )
}

const useStyles = makeStyles({
  container: {
    backgroundColor: styles.colors.primaryLighter,
    borderRadius: styles.spacing.sm,
    marginTop: styles.spacing.sm,
    marginLeft: styles.spacing.lg,
    marginRight: styles.spacing.lg,
    padding: styles.spacing.md,
  },
  email: {
    float: 'right',
    color: styles.colors.grayLight,
    textTransform: 'none',
    letterSpacing: 0,
  },
  enabled: { color: styles.colors.primary },
})
