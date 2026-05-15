import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AttributeValue } from './AttributeValue'
import { JobStatusIcon } from './JobStatusIcon'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { selectActiveAccountId } from '../selectors/accounts'
import { Box } from '@mui/material'

type Props = {
  job: IJob
  attributes: Attribute[]
  required?: Attribute
  mobile?: boolean
  hideIcon?: boolean
  activeJobId?: string
  jobOnlyRoute?: boolean
}

export const JobListItem: React.FC<Props> = ({ job, required, attributes, mobile, hideIcon, activeJobId, jobOnlyRoute }) => {
  const history = useHistory()
  const accountId = useSelector(selectActiveAccountId)
  const privateScript = !!job.file?.owner?.id && job.file.owner.id !== accountId
  const disabled = !job.file

  const handleClick = () => {
    if (jobOnlyRoute || privateScript) {
      history.push(`/runs/job/${job.id}`)
      return
    }

    if (job.status === 'READY') {
      history.push(`/script/${job.file?.id}/${job.id}/run`)
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
      required={required ? <AttributeValue {...{ mobile, job, accountId, attribute: required }} /> : undefined}
      stickyCenter={required?.align === 'center'}
      disableGutters
    >
      {attributes?.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue {...{ mobile, job, accountId, attribute }} />
        </Box>
      ))}
    </GridListItem>
  )
}
