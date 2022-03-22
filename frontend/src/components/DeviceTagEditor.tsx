import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { selectTags } from '../models/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { device?: IDevice; button?: string }

export const DeviceTagEditor: React.FC<Props> = ({ device, button }) => {
  const tags = useSelector((state: ApplicationState) => selectTags(state))
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!device) return null

  return (
    <>
      <Tags
        tags={device.tags}
        onDelete={tag => device && dispatch.tags.remove({ tag, device })}
        onClick={tag => {
          dispatch.devices.set({ tag: { names: [tag.name] } })
          dispatch.devices.fetch()
          history.push('/devices')
        }}
      />
      <TagEditor
        onSelect={tag => dispatch.tags.add({ tag, device })}
        tags={tags}
        filter={device.tags}
        button={button}
      />
    </>
  )
}
