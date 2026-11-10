import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { selectTags } from '../selectors/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'
import { useProductHold } from './DeviceProductNotice'
import { managedBy } from '../helpers/productPolicyHelper'
import { useTranslation } from 'react-i18next'

type Props = { device?: IDevice; button?: string }

export const DeviceTagEditor: React.FC<Props> = ({ device, button }) => {
  const accountId = useSelector((state: State) => selectActiveAccountId(state, device?.accountId))
  const tags = useSelector((state: State) => selectTags(state, accountId))
  const canEdit = useSelector((state: State) => canEditTags(state, accountId))
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { t } = useTranslation()
  // Tags its product holds are changed on the product; under enforced the device adds none of its own.
  const hold = useProductHold(device)

  if (!device) return null

  return (
    <>
      <Tags
        showEmpty={!canEdit}
        tags={device.tags}
        locked={hold.product && { names: hold.tags, title: managedBy(t, hold.product.name, hold.product.sync) }}
        onDelete={canEdit ? tag => dispatch.tags.removeDevice({ tag, device, accountId }) : undefined}
        onClick={tag => {
          dispatch.devices.set({ tag: { values: [tag.name], operator: tag.operator } })
          dispatch.devices.fetchList()
          history.push('/devices')
        }}
      />
      {canEdit && !hold.enforced && (
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
