import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery } from '@mui/material'
import { JobListItem } from './JobListItem'
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
}

export const JobList: React.FC<ScriptListProps> = ({ attributes, required, jobs = [], columnWidths, fetching, hideIcon, activeJobId }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile }} headerIcon>
      {jobs?.map((job, index) => (
        <JobListItem key={index} {...{ job, required, attributes, mobile, hideIcon, activeJobId }} />
      ))}
    </GridList>
  )
}
