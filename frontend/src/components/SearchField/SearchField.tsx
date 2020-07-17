import React from 'react'
import { InputBase, IconButton, Tooltip, Typography } from '@material-ui/core'
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
      <InputBase
        autoFocus
        value={query}
        className={css.input}
        onKeyPress= {(e) => {
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
              <Icon name="times" size="md" type="light" color="grayDarker" fixedWidth />
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
    width: '100%',
    backgroundColor: colors.grayLighter,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginRight: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    transition: 'background-color 300ms',
    borderWidth: '1px 1px 0 1px',
    borderStyle: 'solid',
    borderColor: colors.grayLighter,
    '&:focus,&:hover': { borderColor: colors.grayLight },
  },
  total: {
    marginRight: spacing.sm,
  },
  right: {
    position: 'absolute',
    right: spacing.lg,
  },
})
