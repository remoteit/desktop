import React from 'react'
import { Box } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { selectTags, canEditTags } from '../models/tags'
import { getActiveAccountId } from '../selectors/accounts'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { network?: INetwork; button?: string }

export const NetworkTagEditor: React.FC<Props> = ({ network, button }) => {
  const { tags, accountId, canEdit } = useSelector((state: ApplicationState) => {
    const accountId = getActiveAccountId(state)
    return {
      accountId,
      tags: selectTags(state, accountId),
      canEdit: canEditTags(state, accountId),
    }
  })
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!network) return null

  return (
    <Box display="flex" marginLeft={3.5} marginBottom={3}>
      <Tags
        showEmpty={!canEdit}
        tags={network.tags}
        onDelete={canEdit ? tag => dispatch.tags.removeNetwork({ tag, network }) : undefined}
        onClick={tag => {
          dispatch.devices.set({ tag: { values: [tag.name] } })
          dispatch.devices.fetchList()
          history.push('/devices')
        }}
      />
      {canEdit && (
        <TagEditor
          onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
          onSelect={tag => dispatch.tags.addNetwork({ tag, network })}
          tags={tags}
          filter={network.tags}
          button={button}
        />
      )}
    </Box>
  )
}
