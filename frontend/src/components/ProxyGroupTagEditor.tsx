import React from 'react'
import { Box } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectTags } from '../selectors/tags'
import { canEditTags } from '../models/tags'
import { ProxyGroup } from '../services/graphQLProxyGroups'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = {
  group: ProxyGroup
  disabled?: boolean
  onAdd: (tag: ITag) => void
  onRemove: (tag: ITag) => void
  onClick?: (tag: ITag) => void
}

/* One of the account's groups' tags (graphql-api docs/PROXY-GROUPS.md §11, "Tags on own groups"), as a device's and a
   network's are shown and edited: a role scoped by tags reaches the group by them. The groups listed are those the reader
   manages, and whoever manages a group tags it — with the account's tags; a new tag is made by the account's
   administrators alone, as everywhere else, so only they are offered to make one here. */
export const ProxyGroupTagEditor: React.FC<Props> = ({ group, disabled, onAdd, onRemove, onClick }) => {
  const accountId = useSelector(selectActiveAccountId)
  const tags = useSelector((state: State) => selectTags(state, accountId))
  const canCreate = useSelector((state: State) => canEditTags(state, accountId))
  const dispatch = useDispatch<Dispatch>()
  const carried = group.tags ?? []

  return (
    <Box display="flex" flexWrap="wrap" alignItems="center" gap={0.5} marginTop={0.5} data-group-tags={group.label}>
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
