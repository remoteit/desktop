import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { DeviceListContext } from '../services/Context'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Typography, useMediaQuery } from '@mui/material'
import { ScriptListItem } from './ScriptListItem'
import { Attribute } from './Attributes'
import { LoadMore } from './LoadMore'
import { GridList } from './GridList'
import { Icon } from './Icon'

export interface ScriptListProps {
  attributes: Attribute[]
  required?: Attribute
  columnWidths: ILookup<number>
  fetching?: boolean
  scripts?: IFile[]
  select?: boolean
  selected?: string[]
}

export const ScriptList: React.FC<ScriptListProps> = ({
  attributes,
  required,
  scripts = [],
  columnWidths,
  fetching,
}) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()

  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile }}>
      {scripts?.map((script, index) => (
        <ScriptListItem key={index} {...{ script, required, attributes, mobile }} />
      ))}
      <LoadMore />
    </GridList>
  )
}
