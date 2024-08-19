import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery } from '@mui/material'
import { FileListItem } from './FileListItem'
import { Attribute } from './Attributes'
import { LoadMore } from './LoadMore'
import { GridList } from './GridList'

interface ScriptListProps {
  attributes: Attribute[]
  required?: Attribute
  columnWidths: ILookup<number>
  fetching?: boolean
  files?: IFile[]
}

export const FileList: React.FC<ScriptListProps> = ({ attributes, required, files = [], columnWidths, fetching }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile }}>
      {files?.map((file, index) => (
        <FileListItem key={index} {...{ file, required, attributes, mobile }} />
      ))}
      <LoadMore />
    </GridList>
  )
}
