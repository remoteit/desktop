import { useDispatch, useSelector, useStore } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectVisibleDevices } from '../selectors/devices'
import {
  getInclusiveIdRange,
  getSelectableDeviceIds,
  mergeSelectedIds,
  removeSelectedIds,
  sortSelectedIds,
} from '../helpers/selectionRange'

type UseSelectParams = {
  deviceId: string
  selectMode?: boolean
}

export const useSelect = ({ deviceId, selectMode }: UseSelectParams) => {
  const dispatch = useDispatch<Dispatch>()
  const store = useStore<State>()
  const isSelected = useSelector((state: State) => state.ui.selected.includes(deviceId))
  const isAnchorRow = useSelector((state: State) => !!selectMode && state.ui.selectionAnchor === deviceId)

  const handleSelect = (shiftKey?: boolean) => {
    const state = store.getState()
    const selected = state.ui.selected
    const visibleDevices = selectVisibleDevices(state)
    const selectableIds = getSelectableDeviceIds(visibleDevices)
    const range = shiftKey ? getInclusiveIdRange(selectableIds, state.ui.selectionAnchor, deviceId) : []
    const ids = range.length ? range : [deviceId]
    const nextSelected = isSelected ? removeSelectedIds(selected, ids) : mergeSelectedIds(selected, ids)

    dispatch.ui.set({ selected: sortSelectedIds(nextSelected, visibleDevices), selectionAnchor: deviceId })
  }

  return { isSelected, isAnchorRow, handleSelect }
}
