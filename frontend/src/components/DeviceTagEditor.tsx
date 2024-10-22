import React from 'react'
import { Stack } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { selectTags } from '../selectors/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { device?: IDevice; button?: string }

export const DeviceTagEditor: React.FC<Props> = ({ device, button }) => {
  const accountId = useSelector((state: State) => selectActiveAccountId(state, device?.accountId))
  const tags = useSelector((state: State) => selectTags(state, accountId))
  const canEdit = useSelector((state: State) => canEditTags(state, accountId))
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!device) return null

  return (
    <>
      <Tags
        showEmpty={!canEdit}
        tags={device.tags}
        onDelete={canEdit ? tag => dispatch.tags.removeDevice({ tag, device, accountId }) : undefined}
        onClick={tag => {
          dispatch.devices.set({ tag: { values: [tag.name], operator: tag.operator } })
          dispatch.devices.fetchList()
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
    </>
  )
}
