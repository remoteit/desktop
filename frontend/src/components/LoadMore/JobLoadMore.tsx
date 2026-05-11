import React from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { LoadMore } from './LoadMore'

export const JobLoadMore: React.FC = () => {
  const { fileID } = useParams<{ fileID?: string }>()
  // Fallbacks guard against persisted state from older builds that pre-date these fields.
  const from = useSelector((state: State) => state.jobs.from ?? 0)
  const size = useSelector((state: State) => state.jobs.size || 50)
  const total = useSelector((state: State) => state.jobs.total ?? 0)
  const fetching = useSelector((state: State) => state.jobs.fetching ?? false)
  const dispatch = useDispatch<Dispatch>()

  return (
    <LoadMore
      {...{ from, size, fetching }}
      count={total}
      onLoadMore={() => dispatch.jobs.loadMore({ fileID })}
    />
  )
}
