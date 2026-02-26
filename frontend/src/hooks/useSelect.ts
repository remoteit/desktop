import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectVisibleDevices } from '../selectors/devices'
import { getInclusiveIdRange, getSelectableDeviceIds, mergeSelectedIds, removeSelectedIds } from '../helpers/selectionRange'

type UseSelectParams = {
  deviceId: string
  selected: string[]
  selectMode?: boolean
}

export const useSelect = ({ deviceId, selected, selectMode }: UseSelectParams) => {
  const dispatch = useDispatch<Dispatch>()
  const selectionAnchor = useSelector((state: State) => state.ui.selectionAnchor)
  const visibleDevices = useSelector(selectVisibleDevices)

  const isSelected = selected.includes(deviceId)
  const isAnchorRow = !!selectMode && selectionAnchor === deviceId

  const handleSelect = (shiftKey?: boolean) => {
    const nextSelected = [...selected]
    const selectableIds = getSelectableDeviceIds(visibleDevices)
    const range = shiftKey ? getInclusiveIdRange(selectableIds, selectionAnchor, deviceId) : []

    if (range.length) {
      const rangeSelected = isSelected ? removeSelectedIds(nextSelected, range) : mergeSelectedIds(nextSelected, range)
      dispatch.ui.set({ selected: rangeSelected })
      dispatch.ui.set({ selectionAnchor: deviceId })
      return
    }

    if (isSelected) {
      const index = nextSelected.indexOf(deviceId)
      nextSelected.splice(index, 1)
    } else {
      nextSelected.push(deviceId)
    }

    dispatch.ui.set({ selected: nextSelected })
    dispatch.ui.set({ selectionAnchor: deviceId })
  }

  return { isSelected, isAnchorRow, handleSelect }
}
