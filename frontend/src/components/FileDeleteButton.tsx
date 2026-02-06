import React from 'react'
import { Dispatch } from '../store'
import { useParams, useHistory } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { useDispatch, useSelector } from 'react-redux'
import { DeleteButton } from '../buttons/DeleteButton'
import { Notice } from './Notice'

export const FileDeleteButton: React.FC = () => {
  const { fileID } = useParams<{ fileID?: string }>()
  const permissions = useSelector(selectPermissions)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!permissions.includes('ADMIN') || !fileID) return null

  return (
    <DeleteButton
      title="Delete File"
      warning={
        <Notice severity="error" fullWidth>
          This can not be undone.
        </Notice>
      }
      onDelete={async () => {
        await dispatch.files.delete(fileID)
        history.push('/files')
      }}
    />
  )
}
