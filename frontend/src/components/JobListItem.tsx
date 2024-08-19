import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from './AttributeValue'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { Icon } from './Icon'
import { Box } from '@mui/material'

type Props = {
  job: IJob
  attributes: Attribute[]
  required?: Attribute
  mobile?: boolean
}

export const JobListItem: React.FC<Props> = ({ job, required, attributes, mobile }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!job) return null

  const handleClick = () => {
    history.push(`/scripting/jobs/${job.id}`)
  }

  return (
    <GridListItem
      onClick={handleClick}
      mobile={mobile}
      icon={<Icon name="play" color="primary" type="solid" />}
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
