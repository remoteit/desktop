import React, { useState, useEffect } from 'react'
import { TARGET_PLATFORMS } from '../helpers/platformHelper'
import { defaultState } from '../models/devices'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, List } from '@material-ui/core'
import { FilterSelector } from './FilterSelector'
import { Drawer } from './Drawer'

type IValues = {
  sort: typeof defaultState.sort
  filter: typeof defaultState.filter
  owner: typeof defaultState.owner
  platform: typeof defaultState.platform
}

const sortFilters = [
  { value: 'name', name: 'Name' },
  { value: 'state', name: 'State' },
  { value: 'attributes.$remoteit.color', name: 'Color' },
]
const deviceFilters = [
  { value: 'all', name: 'All' },
  { value: 'active', name: 'Online' },
  { value: 'inactive', name: 'Offline' },
]
const ownerFilters = [
  { value: 'all', name: 'All' },
  { value: 'me', name: 'Me' },
  { value: 'others', name: 'Others' },
]

const platformFilter = [{ value: 'all', name: 'All' }].concat(
  Object.keys(TARGET_PLATFORMS)
    .map(p => ({ value: p, name: TARGET_PLATFORMS[p] }))
    .sort(
      (a, b) =>
        a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : b.name?.toLowerCase() > a.name?.toLowerCase() ? -1 : 0 // only to sort
    )
)

export const FilterDrawer: React.FC = () => {
  const { state, open } = useSelector((state: ApplicationState) => ({
    state: {
      sort: state.devices.sort,
      filter: state.devices.filter,
      owner: state.devices.owner,
      platform: state.devices.platform,
    },
    open: state.ui.drawerMenu === 'FILTER',
  }))
  const { ui, devices } = useDispatch<Dispatch>()
  const [values, setValues] = useState<IValues>(state)
  const css = useStyles()

  const handleClear = () => {
    setValues({
      filter: defaultState.filter,
      sort: defaultState.sort,
      owner: defaultState.owner,
      platform: defaultState.platform,
    })
  }

  useEffect(() => {
    if (
      state.sort !== values.sort ||
      state.filter !== values.filter ||
      state.owner !== values.owner ||
      state.platform !== values.platform
    ) {
      devices.set({ ...values, from: defaultState.from })
      devices.fetch()
    }
  }, [values])

  return (
    <Drawer open={open}>
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
        <FilterSelector
          subtitle="Platform"
          icon="check"
          value={values.platform?.toString() || 'all'}
          onSelect={value => setValues({ ...values, platform: parseInt(value) || undefined })}
          filterList={platformFilter}
        />
      </List>
    </Drawer>
  )
}

const useStyles = makeStyles({
  list: {
    // backgroundColor: colors.white,
    padding: 0,
    '& .MuiListItem-dense': { paddingTop: 0, paddingBottom: 0, paddingLeft: 0 },
  },
})
