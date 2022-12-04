import React from 'react'
import { platforms } from '../platforms'
import { getDeviceModel } from '../selectors/devices'
import { defaultState } from '../models/devices'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { TagFilterToggle } from './TagFilterToggle'
import { FilterSelector } from './FilterSelector'
import { AccordionMenu } from './AccordionMenu'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectTags } from '../models/tags'
import { useLabel } from '../hooks/useLabel'
import { Drawer } from './Drawer'

const sortFilters = [
  { value: 'name', name: 'Name' },
  { value: 'state,name', name: 'Status' },
  // { value: 'attributes.$remoteit.color,name', name: 'Color' },
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
let platformFilter = [{ value: -1, name: 'All' }]

export const FilterDrawer: React.FC = () => {
  const getColor = useLabel()
  const { devices } = useDispatch<Dispatch>()
  const { state, tags, feature } = useSelector((state: ApplicationState) => ({
    state: getDeviceModel(state),
    tags: selectTags(state).map(t => ({ name: t.name, value: t.name, color: getColor(t.color) })),
    feature: selectLimitsLookup(state),
  }))

  const update = values => {
    values = { ...values, from: defaultState.from }
    devices.setPersistent(values)
    devices.fetchList()
  }

  return (
    <Drawer menu="FILTER">
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
                filterList={platformFilter.concat(
                  Object.keys(platforms.nameLookup)
                    .map(p => ({ value: parseInt(p), name: platforms.nameLookup[p] }))
                    .sort((a, b) => (a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : -1))
                )}
              />
            ),
          },
        ]}
      />
    </Drawer>
  )
}
