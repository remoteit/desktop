import React from 'react'
import { Box } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { getActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { selectTags } from '../selectors/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { button?: string; tags: string[]; onChange: (tags: string[]) => void }

export const AddPlatformTags: React.FC<Props> = ({ button, tags, onChange }) => {
  const { allTags, accountId, canEdit } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    allTags: selectTags(state),
    canEdit: canEditTags(state),
  }))
  const dispatch = useDispatch<Dispatch>()
  const selectedTags = allTags.filter(t => tags.includes(t.name))

  return (
    <Box display="flex" flexWrap="wrap" justifyContent="flex-end" marginTop={2}>
      <Tags
        textAlign="right"
        showEmpty={!canEdit}
        tags={selectedTags}
        onDelete={canEdit ? tag => onChange(tags.filter(t => t !== tag.name)) : undefined}
      />
      {canEdit && (
        <TagEditor
          onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
          onSelect={tag => onChange([...tags, tag.name])}
          tags={allTags}
          filter={selectedTags}
          button={button}
        />
      )}
    </Box>
  )
}
