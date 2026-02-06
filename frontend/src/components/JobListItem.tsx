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
}

export const JobListItem: React.FC<Props> = ({ job, required, attributes, mobile }) => {
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
      icon={<JobStatusIcon status={job.status} />}
      required={<AttributeValue {...{ mobile, job, attribute: required }} />}
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
