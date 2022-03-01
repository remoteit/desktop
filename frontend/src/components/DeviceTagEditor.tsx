import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { device?: IDevice; selected?: string[]; button?: string }

export const DeviceTagEditor: React.FC<Props> = ({ device, selected, button }) => {
  const dispatch = useDispatch<Dispatch>()

  if (!device) return null

  return (
    <>
      {device && (
        <Tags
          tags={device.tags}
          onDelete={tag => device && dispatch.tags.remove({ tag, device })}
          onClick={console.log /* should select the tag to filer by and show device list */}
        />
      )}
      <TagEditor onSelect={tag => dispatch.tags.add({ tag, device })} tags={device.tags} button={button} />
    </>
  )
}
