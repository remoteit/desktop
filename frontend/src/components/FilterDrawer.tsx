import React from 'react'
import { getDeviceModel } from '../models/accounts'
import { defaultState } from '../models/devices'
import { TARGET_PLATFORMS } from '../helpers/platformHelper'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { TagFilterToggle } from './TagFilterToggle'
import { FilterSelector } from './FilterSelector'
import { selectFeature } from '../models/ui'
import { AccordionMenu } from './AccordionMenu'
import { selectTags } from '../models/tags'
import { useLabel } from '../hooks/useLabel'
import { Drawer } from './Drawer'

const sortFilters = [
  { value: 'name', name: 'Name' },
  { value: 'state,name', name: 'State' },
  { value: 'attributes.$remoteit.color,name', name: 'Color' },
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
const platformFilter = [{ value: -1, name: 'All' }].concat(
  Object.keys(TARGET_PLATFORMS)
    .map(p => ({ value: parseInt(p), name: TARGET_PLATFORMS[p] }))
    .sort(
      (a, b) =>
        a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : b.name?.toLowerCase() > a.name?.toLowerCase() ? -1 : 0 // only to sort
    )
)

export const FilterDrawer: React.FC = () => {
  const getColor = useLabel()
  const { devices } = useDispatch<Dispatch>()
  const { state, open, tags, feature } = useSelector((state: ApplicationState) => ({
    state: getDeviceModel(state),
    open: state.ui.drawerMenu === 'FILTER',
    tags: selectTags(state).map(t => ({ name: t.name, value: t.name, color: getColor(t.color) })),
    feature: selectFeature(state),
  }))

  const update = values => {
    values = { ...values, from: defaultState.from }
    devices.setPersistent(values)
    devices.fetch()
  }

  return (
    <Drawer open={open}>
      <AccordionMenu
        menus={[
          {
            key: 'sort',
            subtitle: 'Sort',
            onClear: defaultState.sort === state.sort ? undefined : () => update({ sort: defaultState.sort }),
            children: (
              <FilterSelector
                icon={state.sort.substring(0, 1) === '-' ? 'sort-amount-up' : 'sort-amount-down'}
                value={state.sort}
                onSelect={value => {
                  if (state.sort === value) value = value.substring(0, 1) === '-' ? value : `-${value}`
                  update({ sort: value })
                }}
                filterList={sortFilters}
              />
            ),
          },
          {
            key: 'tag',
            subtitle: 'Tags',
            onClear: state.tag === undefined ? undefined : () => update({ tag: undefined }),
            disabled: !feature.tagging,
            children: (
              <FilterSelector
                icon="check"
                value={state.tag?.values || ['']}
                onSelect={value => {
                  let result = state.tag?.values
                  const index = result && result.indexOf(value)

                  if (index !== undefined && index >= 0) result?.splice(index, 1)
                  else if (value === '') result = undefined
                  else result === undefined ? (result = [value]) : result.push(value)

                  if (!result?.length) update({ tag: undefined })
                  else update({ tag: { values: result, operator: state.tag?.operator || 'ANY' } })
                }}
                filterList={tags}
              >
                <TagFilterToggle tag={state.tag} onUpdate={update} />
              </FilterSelector>
            ),
          },
          {
            key: 'state',
            subtitle: 'State',
            onClear: defaultState.filter === state.filter ? undefined : () => update({ filter: defaultState.filter }),
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
            onClear: defaultState.owner === state.owner ? undefined : () => update({ owner: defaultState.owner }),
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
            onClear: state.platform === undefined ? undefined : () => update({ platform: undefined }),
            children: (
              <FilterSelector
                icon="check"
                value={state.platform === undefined ? [-1] : state.platform}
                onSelect={value => {
                  let result = Array.isArray(state.platform) ? state.platform : undefined
                  const index = result && result.indexOf(value)

                  if (index !== undefined && index >= 0) result?.splice(index, 1)
                  else if (value === -1) result = undefined
                  else result === undefined ? (result = [value]) : result.push(value)

                  if (!result?.length) result = undefined
                  update({ platform: result })
                }}
                filterList={platformFilter}
              />
            ),
          },
        ]}
      />
    </Drawer>
  )
}
