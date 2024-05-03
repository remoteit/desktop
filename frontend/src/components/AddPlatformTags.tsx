import React from 'react'
import { Stack, StackProps } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { selectTags } from '../selectors/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = StackProps & { button?: string; tags: string[]; onChange: (tags: string[]) => void }

export const AddPlatformTags: React.FC<Props> = ({ button, tags, onChange, ...props }) => {
  const { allTags, accountId, canEdit } = useSelector((state: State) => ({
    accountId: selectActiveAccountId(state),
    allTags: selectTags(state),
    canEdit: canEditTags(state),
  }))
  const dispatch = useDispatch<Dispatch>()
  const selectedTags = allTags.filter(t => tags.includes(t.name))

  return (
    <Stack flexWrap="wrap" alignItems="flex-end" marginTop={2} {...props}>
      <Tags
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
    </Stack>
  )
}
