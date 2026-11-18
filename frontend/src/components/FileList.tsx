import React from 'react'
import { useMobile } from '../hooks/useMobile'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FileListItem } from './FileListItem'
import { Attribute } from './Attributes'
import { GridList } from './GridList'

interface FileListProps {
  attributes: Attribute[]
  required?: Attribute
  columnWidths: ILookup<number>
  fetching?: boolean
  scripts?: IScript[]
  isScriptList?: boolean
}

export const FileList: React.FC<FileListProps> = ({ attributes, required, scripts = [], columnWidths, fetching, isScriptList = true }) => {
  const { fileID } = useParams<{ fileID?: string }>()
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const mobile = useMobile()
  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile }} headerIcon>
      {scripts?.map((script, index) => (
        <FileListItem
          key={index}
          {...{ script, required, attributes, mobile, selectedIds, fileID, isScript: isScriptList }}
        />
      ))}
    </GridList>
  )
}
