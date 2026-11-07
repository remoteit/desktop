import React from 'react'
import { Box } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectTags } from '../selectors/tags'
import { canEditTags } from '../models/tags'
import type { Exit } from '../services/graphQLExits'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = {
  exit: Pick<Exit, 'id' | 'tags'>
  disabled?: boolean
  onAdd: (tag: ITag) => void
  onRemove: (tag: ITag) => void
  onClick?: (tag: ITag) => void
}

/* One of the account's exits' tags (graphql-api docs/PROXY-GROUPS.md §13), as a device's and a network's are shown and
   edited: a role scoped by tags reaches the exit by them. Whoever manages an exit tags it — with the account's tags; a
   new tag is made by the account's administrators alone, as everywhere else, so only they are offered to make one
   here. */
export const ExitTagEditor: React.FC<Props> = ({ exit, disabled, onAdd, onRemove, onClick }) => {
  const accountId = useSelector(selectActiveAccountId)
  const tags = useSelector((state: State) => selectTags(state, accountId))
  const canCreate = useSelector((state: State) => canEditTags(state, accountId))
  const dispatch = useDispatch<Dispatch>()
  const carried = exit.tags ?? []

  return (
    <Box display="flex" flexWrap="wrap" alignItems="center" gap={0.5} marginTop={0.5} data-exit-tags={exit.id}>
      <Tags
        tags={carried}
        onDelete={disabled ? undefined : tag => onRemove(tag)}
        onClick={onClick ? tag => onClick(tag) : undefined}
      />
      <TagEditor
        tags={tags}
        filter={carried}
        allowAdding={canCreate}
        disabled={disabled}
        keyboardShortcut={false}
        onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
        onSelect={onAdd}
      />
    </Box>
  )
}
