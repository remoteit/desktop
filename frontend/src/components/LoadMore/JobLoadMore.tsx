import React from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { LoadMore } from './LoadMore'

export const JobLoadMore: React.FC = () => {
  const { fileID } = useParams<{ fileID?: string }>()
  const from = useSelector((state: State) => state.jobs.from)
  const size = useSelector((state: State) => state.jobs.size)
  const total = useSelector((state: State) => state.jobs.total)
  const fetching = useSelector((state: State) => state.jobs.fetching)
  const dispatch = useDispatch<Dispatch>()

  return (
    <LoadMore
      {...{ from, size, fetching }}
      count={total}
      onLoadMore={() => dispatch.jobs.loadMore({ fileID })}
    />
  )
}
