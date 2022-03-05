import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { device?: IDevice; selected?: string[]; button?: string }

export const DeviceTagEditor: React.FC<Props> = ({ device, selected, button }) => {
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
      <TagEditor onSelect={tag => dispatch.tags.add({ tag, device })} tags={device.tags} button={button} />
    </>
  )
}
