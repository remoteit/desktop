import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dispatch } from '../store'
import { useParams, useHistory } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { useDispatch, useSelector } from 'react-redux'
import { DeleteButton } from '../buttons/DeleteButton'
import { Notice } from './Notice'

type Props = { device?: IDevice; service?: IService; user?: IUser }

export const ScriptDeleteButton: React.FC<Props> = ({  }) => {
  const { t } = useTranslation()
  const { fileID } = useParams<{ fileID?: string }>()
  const permissions = useSelector(selectPermissions)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  if (!permissions.includes('ADMIN') || !fileID) return null

  return (
    <DeleteButton
      title={t('scriptDeleteButton.title', 'Delete Script')}
      warning={
        <Notice severity="error" fullWidth>
          {t('scriptDeleteButton.warning', 'This can not be undone.')}
        </Notice>
      }
      onDelete={async () => {
        await dispatch.files.delete(fileID)
        history.push('/scripts')
      }}
    />
  )
}
