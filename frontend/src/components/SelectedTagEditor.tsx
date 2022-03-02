import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { TagEditor } from './TagEditor'

type Props = { selected?: string[]; button?: string }

export const SelectedTagEditor: React.FC<Props> = ({ selected = [], button }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  return (
    <TagEditor
      onSelect={tag => {
        dispatch.tags.addSelected({ tag, selected })
        history.push('/devices')
        // dispatch.ui.set({ selected: [] })
      }}
      button={button}
      color="alwaysWhite"
    />
  )
}
