import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { TagEditor } from './TagEditor'

type Props = { selected?: string[]; button?: string }

export const SelectedTagEditor: React.FC<Props> = ({ selected = [], button }) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <TagEditor
      onSelect={tag => {
        dispatch.tags.addSelected({ tag, selected })
        // dispatch.ui.set({ selected: [] })
      }}
      button={button}
      color="alwaysWhite"
    />
  )
}
