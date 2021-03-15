import React from 'react'
import { TextField, IconButton, Tooltip, Typography } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { spacing, colors } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'

export const SearchField: React.FC = () => {
  const { total, results, query, searched, fetching, filter } = useSelector((state: ApplicationState) => state.devices)
  const { devices } = useDispatch<Dispatch>()

  // not compatible with DESK-648
  const disabled = Boolean(fetching || query.length < 2)

  const css = useStyles()

  const totalTitle = filter ? 'Filtered' : 'Total'
  const title = searched ? `Searched / ${totalTitle}` : `${totalTitle} Devices`

  return (
    <form
      className={css.field}
      onSubmit={e => {
        e.preventDefault()
        devices.set({ searched: true, from: 0 })
        devices.fetch()
      }}
    >
      <TextField
        fullWidth
        value={query}
        variant="filled"
        className={css.input}
        SelectProps={{ disableUnderline: true }}
        onKeyPress={e => {
          if (e.key === 'Enter' && query.trim().length < 2) {
            devices.set({ query: '', searched: false, from: 0 })
            devices.fetch()
          }
        }}
        onChange={e => devices.set({ query: e.target.value })}
        placeholder="Search devices and services..."
      />
      <div className={css.right}>
        <Tooltip className={css.total} title={title}>
          <Typography variant="caption">{searched ? `${results}/${total}` : total}</Typography>
        </Tooltip>
        {(searched || query) && (
          <Tooltip title="Clear search">
            <IconButton
              type="button"
              onClick={() => {
                devices.set({ query: '', searched: false, from: 0 })
                devices.fetch()
              }}
            >
              <Icon name="times" size="md" color="grayDarker" fixedWidth />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Search">
          <span>
            <IconButton type="submit" disabled={disabled}>
              <Icon name="search" size="md" type="regular" color={disabled ? 'gray' : 'grayDarker'} fixedWidth />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </form>
  )
}

const useStyles = makeStyles({
  field: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    marginRight: spacing.sm,
  },
  total: {
    marginRight: spacing.sm,
  },
  right: {
    position: 'absolute',
    right: spacing.lg,
  },
})
