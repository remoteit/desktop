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

  const onLoadMore = () => {
    const nextFrom = (Math.floor(from / size) + 1) * size
    dispatch.devices.set({ from: nextFrom, append: true })
    dispatch.devices.fetchList()
  }

  return <LoadMore {...{ from, size, count, fetching, onLoadMore }} />
}
