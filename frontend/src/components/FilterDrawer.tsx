import React from 'react'
import { TARGET_PLATFORMS } from '../helpers/platformHelper'
import { defaultState } from '../models/devices'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { AccordionMenu } from './AccordionMenu'
import { FilterSelector } from './FilterSelector'
import { Drawer } from './Drawer'

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
  const { devices } = useDispatch<Dispatch>()

  const update = values => {
    values = { ...values, from: defaultState.from }
    devices.setPersistent(values)
    devices.fetch()
  }

  return (
    <Drawer open={open}>
      <AccordionMenu
        defaultExpanded="sort"
        menus={[
          {
            key: 'sort',
            subtitle: 'Sort',
            children: (
              <FilterSelector
                icon={state.sort.substr(0, 1) === '-' ? 'sort-amount-up' : 'sort-amount-down'}
                value={state.sort}
                onSelect={value => {
                  if (state.sort === value) value = value.substr(0, 1) === '-' ? value : `-${value}`
                  update({ sort: value })
                }}
                filterList={sortFilters}
              />
            ),
          },
          {
            key: 'state',
            subtitle: 'State',
            children: (
              <FilterSelector
                icon="check"
                value={state.filter}
                onSelect={value => update({ filter: value })}
                filterList={deviceFilters}
              />
            ),
          },
          {
            key: 'owner',
            subtitle: 'Owner',
            children: (
              <FilterSelector
                icon="check"
                value={state.owner}
                onSelect={value => update({ owner: value })}
                filterList={ownerFilters}
              />
            ),
          },
          {
            key: 'platform',
            subtitle: 'Platform',
            children: (
              <FilterSelector
                icon="check"
                value={state.platform || 'all'}
                onSelect={value => update({ platform: parseInt(value) || undefined })}
                filterList={platformFilter}
              />
            ),
          },
        ]}
      />
    </Drawer>
  )
}
