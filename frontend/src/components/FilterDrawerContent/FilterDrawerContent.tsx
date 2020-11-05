import React, { useState, useEffect } from 'react'
import { state as defaults } from '../../models/devices'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, List, Button } from '@material-ui/core'
import { FilterSelector } from './FilterSelector'
import { CloseButton } from '../../buttons/CloseButton'
import { spacing } from '../../styling'
import classnames from 'classnames'

type IValues = {
  sort: typeof defaults.sort
  filter: typeof defaults.filter
  owner: typeof defaults.owner
}

const sortFilters = [
  { value: 'name', filterName: 'Name' },
  { value: 'state', filterName: 'State' },
  { value: 'color', filterName: 'Color' },
]
const deviceFilters = [
  { value: 'all', filterName: 'All' },
  { value: 'active', filterName: 'Online' },
  { value: 'inactive', filterName: 'Offline' },
]
const ownerFilters = [
  { value: 'all', filterName: 'All' },
  { value: 'me', filterName: 'Me' },
  { value: 'others', filterName: 'Others' },
]

export const FilterDrawerContent: React.FC = () => {
  const { state, open } = useSelector((state: ApplicationState) => ({
    state: {
      sort: state.devices.sort,
      filter: state.devices.filter,
      owner: state.devices.owner,
    },
    open: state.ui.filterMenu,
  }))
  const { ui, devices } = useDispatch<Dispatch>()
  const [values, setValues] = useState<IValues>(state)
  const css = useStyles()

  const handleClear = () => {
    setValues({
      filter: defaults.filter,
      sort: defaults.sort,
      owner: defaults.owner,
    })
  }

  useEffect(() => {
    if (state.sort !== values.sort || state.filter !== values.filter || state.owner !== values.owner) {
      devices.set({ ...values, from: defaults.from })
      devices.fetch()
    }
  }, [values])

  return (
    <div className={classnames(css.drawer, open || css.drawerClose)}>
      <div className={css.drawerHeader}>
        <Button size="small" onClick={handleClear}>
          clear
        </Button>
        <CloseButton onClick={() => ui.set({ filterMenu: false })} />
      </div>
      <List dense className={css.list}>
        <FilterSelector
          subtitle="Sort"
          icon={values.sort.substr(0, 1) === '-' ? 'sort-amount-up' : 'sort-amount-down'}
          value={values.sort}
          onSelect={value => {
            if (values.sort === value) value = value.substr(0, 1) === '-' ? value : `-${value}`
            setValues({ ...values, sort: value })
          }}
          filterList={sortFilters}
        />
        <FilterSelector
          subtitle="State"
          icon="check"
          value={values.filter}
          onSelect={value => setValues({ ...values, filter: value })}
          filterList={deviceFilters}
        />
        <FilterSelector
          subtitle="Owner"
          icon="check"
          value={values.owner}
          onSelect={value => setValues({ ...values, owner: value })}
          filterList={ownerFilters}
        />
      </List>
    </div>
  )
}

const useStyles = makeStyles({
  drawer: {
    maxWidth: 180,
    transition: 'max-width 200ms ease-out',
    '& > *': { minWidth: 180 },
  },
  drawerClose: {
    maxWidth: 0,
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  list: {
    padding: 0,
    '& > .MuiListItem-dense': { paddingTop: 0, paddingBottom: 0, paddingLeft: 0 },
    '& > .MuiListItem-dense + .MuiDivider-root': { marginTop: spacing.sm },
  },
})
