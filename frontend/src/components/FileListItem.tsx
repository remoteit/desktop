import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AttributeValue } from './AttributeValue'
import { JobStatusIcon } from './JobStatusIcon'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { State } from '../store'
import { Icon } from './Icon'
import { Box } from '@mui/material'

type Props = {
  script: IScript
  attributes: Attribute[]
  required?: Attribute
  mobile?: boolean
  selectedIds?: string[]
  fileID?: string
  isScript?: boolean
}

export const FileListItem: React.FC<Props> = ({ script, required, attributes, mobile, selectedIds, fileID, isScript = true }) => {
  const history = useHistory()
  const singlePanel = useSelector((state: State) => state.ui.layout.singlePanel)

  if (!script) return null

  const basePath = isScript ? 'script' : 'file'
  const listPath = isScript ? 'scripts' : 'files'

  const handleClick = () => {
    if (selectedIds?.length) history.push(`/${listPath}/${script.id}`)
    else if (isScript && !singlePanel) history.push(`/${basePath}/${script.id}/latest/edit`)
    else history.push(`/${basePath}/${script.id}`)
  }

  return (
    <GridListItem
      onClick={handleClick}
      mobile={mobile}
      icon={
        script.job ? (
          <JobStatusIcon status={script.job?.status} />
        ) : (
          <Icon name="file" size="sm" color="grayLight" type="solid" />
        )
      }
      required={<AttributeValue {...{ mobile, file: script, attribute: required }} />}
      selected={script.id === fileID}
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
