import React from 'react'
import { useMobile } from '../hooks/useMobile'
import { JobListItem } from './JobListItem'
import { JobLoadMore } from './LoadMore'
import { Attribute } from './Attributes'
import { GridList } from './GridList'

export interface ScriptListProps {
  attributes: Attribute[]
  required?: Attribute
  columnWidths: ILookup<number>
  fetching?: boolean
  jobs?: IJob[]
  hideIcon?: boolean
  activeJobId?: string
  loadMore?: boolean
  jobOnlyRoute?: boolean
}

export const JobList: React.FC<ScriptListProps> = ({
  attributes,
  required,
  jobs = [],
  columnWidths,
  fetching,
  hideIcon,
  activeJobId,
  loadMore,
  jobOnlyRoute,
}) => {
  const mobile = useMobile()
  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile }} headerIcon>
      {jobs?.map((job, index) => (
        <JobListItem key={index} {...{ job, required, attributes, mobile, hideIcon, activeJobId, jobOnlyRoute }} />
      ))}
      {loadMore && <JobLoadMore />}
    </GridList>
  )
}
