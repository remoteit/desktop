import React from 'react'
import { Dispatch } from '../store'
import { useParams } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { useDispatch, useSelector } from 'react-redux'
import { DeleteButton } from '../buttons/DeleteButton'
import { Notice } from './Notice'

type Props = { device?: IDevice; service?: IService; user?: IUser }

export const ScriptDeleteButton: React.FC<Props> = ({ device, service }) => {
  const { fileID } = useParams<{ fileID?: string }>()
  const permissions = useSelector(selectPermissions)
  const dispatch = useDispatch<Dispatch>()

  if (!permissions.includes('ADMIN') || !fileID) return null

  return (
    <DeleteButton
      title="Delete Script"
      warning={
        <Notice severity="error" fullWidth>
          This can not be undone.
        </Notice>
      }
      onDelete={async () => await dispatch.files.delete(fileID)}
    />
  )
}
