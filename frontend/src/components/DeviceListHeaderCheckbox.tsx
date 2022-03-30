import React from 'react'
import { getDeviceModel } from '../models/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Checkbox } from '@material-ui/core'
import { Icon } from './Icon'

type Props = { select?: boolean; devices: IDevice[] }

export const DeviceListHeaderCheckbox: React.FC<Props> = ({ select, devices }) => {
  const { selected, total } = useSelector((state: ApplicationState) => ({
    selected: state.ui.selected,
    total: getDeviceModel(state).total,
  }))
  const dispatch = useDispatch<Dispatch>()
  const indeterminate = selected.length > 0 && selected.length < total

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
        checked={selected.length === total}
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
