import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { List } from '@mui/material'
import { ListItemCheckbox } from '../ListItemCheckbox'

interface CheckboxItem {
  label: string
  value: string
}

export function ServiceCheckboxes({
  onChange,
  services = [],
  saving,
  selectedServices = [],
}: {
  onChange: (services: string[]) => void
  services: CheckboxItem[]
  saving: boolean
  selectedServices: string[]
}): JSX.Element {
  const { shares } = useDispatch<Dispatch>()
  const indeterminateServices = useSelector(
    (state: ApplicationState) => state.shares.currentDevice?.indeterminate || []
  )

  const allIndeterminate = !!selectedServices.length && services.length !== selectedServices.length
  const selectAllChecked = !!selectedServices.length && services.length === selectedServices.length

  const update = (checked: boolean, id: string): void => {
    const all = checked ? [...selectedServices, id] : selectedServices.filter(v => v !== id && v)
    shares.changeIndeterminate(indeterminateServices.filter(sI => sI !== id))
    onChange(all)
  }

  const selectAll = (checked: boolean, services: CheckboxItem[]): void => {
    const ids = services.map(service => service.value).filter(id => [...selectedServices, id])
    const all = checked ? ids : []
    shares.selectAllServices()
    onChange(all)
  }

  return (
    <List className="collapseList">
      <ListItemCheckbox
        disabled={saving}
        label={<i>Select all</i>}
        onClick={checked => selectAll(checked, services)}
        checked={selectAllChecked}
        indeterminate={allIndeterminate}
      />
      {services.map((service, key) => (
        <ListItemCheckbox
          key={key}
          disabled={saving}
          label={service.label}
          checked={selectedServices.includes(service.value)}
          onClick={checked => update(checked, service.value)}
          indeterminate={indeterminateServices.includes(service.value)}
        />
      ))}
    </List>
  )
}
