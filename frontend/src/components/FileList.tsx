import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery } from '@mui/material'
import { FileListItem } from './FileListItem'
import { Attribute } from './Attributes'
import { GridList } from './GridList'

interface FileListProps {
  attributes: Attribute[]
  required?: Attribute
  columnWidths: ILookup<number>
  fetching?: boolean
  scripts?: IScript[]
}

export const FileList: React.FC<FileListProps> = ({ attributes, required, scripts = [], columnWidths, fetching }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile }}>
      {scripts?.map((script, index) => (
        <FileListItem key={index} {...{ script, required, attributes, mobile }} />
      ))}
    </GridList>
  )
}
