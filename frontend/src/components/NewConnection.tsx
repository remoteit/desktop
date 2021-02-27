import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { TextField, Typography } from '@material-ui/core'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import { connectionName } from '../helpers/connectionHelper'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { getAllDevices } from '../models/accounts'
import { Title } from './Title'
import styles from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const NewConnection: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { devices } = useSelector((state: ApplicationState) => ({
    devices: getAllDevices(state)
      .filter(d => !d.hidden)
      .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
      .map(d =>
        d.services.map(s => ({
          deviceName: d.name,
          ...s,
        }))
      )
      .flat(),
  }))

  useEffect(() => {
    analyticsHelper.track('newConnection')
  }, [])

  console.log('DEVICES MENU', devices)

  return (
    <>
      <Typography variant="subtitle1">
        <Title enabled={true}>New Connection</Title>
      </Typography>
      <div className={css.container}>
        <Autocomplete
          autoHighlight
          autoComplete
          autoSelect
          options={devices}
          groupBy={option => option.deviceName}
          getOptionLabel={option => connectionName(option, { name: option.deviceName })}
          getOptionDisabled={option => option.state === 'inactive'}
          getOptionSelected={(option, value) => option.id === value.id}
          filterOptions={createFilterOptions({ stringify: option => option.name + ' ' + option.deviceName })}
          renderInput={params => <TextField {...params} label="Select a service" size="small" variant="filled" />}
          renderOption={option => option.name}
          onChange={(event, value, reason) => {
            if (reason === 'select-option') history.push(`/connections/new/${value?.id}`)
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
})
