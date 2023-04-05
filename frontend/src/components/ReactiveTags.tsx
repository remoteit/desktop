import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Tags, TagProps } from './Tags'

const AVERAGE_TAG_WIDTH = 85

export const ReactiveTags: React.FC<TagProps> = props => {
  const max = useSelector((state: ApplicationState) => Math.floor(state.ui.columnWidths.tags / AVERAGE_TAG_WIDTH))

  return <Tags {...props} max={max} small />
}
