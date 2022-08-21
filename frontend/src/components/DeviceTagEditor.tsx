import React from 'react'
import { Box } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { accountFromDevice } from '../models/accounts'
import { selectTags, canEditTags } from '../models/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { device?: IDevice; button?: string }

export const DeviceTagEditor: React.FC<Props> = ({ device, button }) => {
  const { tags, accountId, canEdit } = useSelector((state: ApplicationState) => {
    const accountId = accountFromDevice(state, device)
    return {
      accountId,
      tags: selectTags(state, accountId),
      canEdit: canEditTags(state, accountId),
    }
  })
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!device) return null

  return (
    <Box display="flex" marginLeft={3.5} marginBottom={3}>
      <Tags
        showEmpty={!canEdit}
        tags={device.tags}
        onDelete={canEdit ? tag => dispatch.tags.removeDevice({ tag, device, accountId }) : undefined}
        onClick={tag => {
          dispatch.devices.set({ tag: { values: [tag.name] } })
          dispatch.devices.fetch()
          history.push('/devices')
        }}
      />
      {canEdit && (
        <TagEditor
          onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
          onSelect={tag => dispatch.tags.addDevice({ tag, device, accountId })}
          tags={tags}
          filter={device.tags}
          button={button}
        />
      )}
    </Box>
  )
}
