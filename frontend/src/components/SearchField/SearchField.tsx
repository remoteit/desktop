import React from 'react'
import { InputBase, IconButton, Tooltip, Typography } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { spacing, colors } from '../../styling'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'

export const SearchField: React.FC = () => {
  const { total, results, query, searched, fetching, filter } = useSelector((state: ApplicationState) => state.devices)
  const { devices } = useDispatch<Dispatch>()
  const disabled = Boolean(fetching || !query)
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
              <Icon name="times" size="md" weight="light" color="grayDarker" fixedWidth />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Search">
          <IconButton type="submit" disabled={disabled}>
            <Icon name="search" size="md" weight="regular" color={disabled ? 'gray' : 'grayDarker'} fixedWidth />
          </IconButton>
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
    '&:focus,&:hover': {
      backgroundColor: colors.grayLight,
    },
  },
  total: {
    marginRight: spacing.sm,
  },
  right: {
    position: 'absolute',
    right: spacing.lg,
  },
})
