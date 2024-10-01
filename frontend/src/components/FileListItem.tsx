import React from 'react'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from './AttributeValue'
import { JobStatusIcon } from './JobStatusIcon'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { Box } from '@mui/material'

type Props = {
  script: IScript
  attributes: Attribute[]
  required?: Attribute
  mobile?: boolean
}

export const FileListItem: React.FC<Props> = ({ script, required, attributes, mobile }) => {
  const history = useHistory()

  if (!script) return null

  const handleClick = () => {
    history.push(`/scripting/${script.id}`)
  }

  return (
    <GridListItem
      onClick={handleClick}
      mobile={mobile}
      icon={<JobStatusIcon status={script.job?.status} />}
      required={<AttributeValue {...{ mobile, file: script, attribute: required }} />}
      disableGutters
    >
      {attributes?.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue {...{ mobile, file: script, attribute }} />
        </Box>
      ))}
    </GridListItem>
  )
}
