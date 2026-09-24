import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { LoadMore } from './LoadMore'

export const DeviceLoadMore: React.FC = () => {
  const { from, size, total, results, searched, fetching } = useSelector((state: State) =>
    selectDeviceModelAttributes(state)
  )
  const dispatch = useDispatch<Dispatch>()
  const count = searched ? results : total

  const onLoadMore = async () => {
    const nextFrom = (Math.floor(from / size) + 1) * size
    dispatch.devices.set({ from: nextFrom, append: true })
    if (!(await dispatch.devices.fetchList())) dispatch.devices.set({ from })
  }

  return <LoadMore {...{ from, size, count, fetching, onLoadMore }} />
}
