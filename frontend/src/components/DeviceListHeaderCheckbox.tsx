import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Checkbox } from '@mui/material'
import { Icon } from './Icon'

type Props = { select?: boolean; devices: IDevice[] }

export const DeviceListHeaderCheckbox: React.FC<Props> = ({ select, devices }) => {
  const { selected } = useSelector((state: State) => state.ui)
  const dispatch = useDispatch<Dispatch>()
  const indeterminate = selected.length > 0 && selected.length < devices.length

  if (!select) return null

  const onClick = event => {
    event.stopPropagation()
    if (indeterminate || selected.length === 0) {
      dispatch.ui.set({ selected: devices.map(d => d.id) })
    } else {
      dispatch.ui.set({ selected: [] })
    }
  }

  return (
    <>
      <Checkbox
        checked={selected.length === devices.length}
        indeterminate={indeterminate}
        onClick={onClick}
        checkedIcon={<Icon name="check-square" size="md" type="solid" />}
        indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
        icon={<Icon name="square" size="md" type="light" />}
        color="primary"
      />
    </>
  )
}
