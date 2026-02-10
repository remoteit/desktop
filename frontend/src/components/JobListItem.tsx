import React from 'react'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from './AttributeValue'
import { JobStatusIcon } from './JobStatusIcon'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { Box } from '@mui/material'

type Props = {
  job: IJob
  attributes: Attribute[]
  required?: Attribute
  mobile?: boolean
  hideIcon?: boolean
  activeJobId?: string
}

export const JobListItem: React.FC<Props> = ({ job, required, attributes, mobile, hideIcon, activeJobId }) => {
  const history = useHistory()
  const disabled = !job.file

  if (!job) return null

  const handleClick = () => {
    if (job.status === 'READY') {
      history.push(`/script/${job.file?.id}/edit/${job.id}`)
    } else {
      history.push(`/script/${job.file?.id}/${job.id}`)
    }
  }

  return (
    <GridListItem
      onClick={handleClick}
      mobile={mobile}
      disabled={disabled}
      selected={activeJobId === job.id}
      icon={required ? (hideIcon ? undefined : <JobStatusIcon status={job.status} />) : undefined}
      required={required ? <AttributeValue {...{ mobile, job, attribute: required }} /> : undefined}
      stickyCenter={required?.align === 'center'}
      disableGutters
    >
      {attributes?.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue {...{ mobile, job, attribute }} />
        </Box>
      ))}
    </GridListItem>
  )
}
