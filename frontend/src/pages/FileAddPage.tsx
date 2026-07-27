import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { selectRole } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Body } from '../components/Body'
import { Dispatch } from '../store'
import { FileEditorForm } from '../components/FileEditorForm'

type Props = { center?: boolean }

export const FileAddPage: React.FC<Props> = ({ center }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  
  const [form, setForm] = useState<IFileForm>({
    name: '',
    description: '',
    executable: false,
    tag: { operator: 'ALL', values: [] },
    deviceIds: [],
    access: 'NONE',
    fileId: '',
    script: '',
    argumentDefinitions: [],
    argumentValues: [],
  })
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!uploadedFile || !form.name) return

    const uploadForm = { ...form, executable: false }
    setLoading(true)
    const fileId = await dispatch.files.upload(uploadForm)
    setLoading(false)

    if (fileId) {
      history.push('/files')
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setForm(prev => ({ ...prev, name: '', file: undefined }))
  }

  if (!manager) {
    return (
      <Body center={center} inset gutterTop gutterBottom>
        <Typography variant="body2" color="error">
          {t('fileAddPage.noPermission', 'You do not have permission to upload files')}
        </Typography>
      </Body>
    )
  }

  return (
    <Body center={center} inset gutterTop gutterBottom>
      <FileEditorForm
        title={t('fileAddPage.uploadFile', 'Upload File')}
        form={{ name: form.name, description: form.description }}
        uploadLabel={t('fileAddPage.uploadFile', 'Upload File')}
        uploadedFile={uploadedFile}
        onFormChange={changes => setForm(prev => ({ ...prev, ...changes }))}
        onUploadedFileChange={file => {
          if (!file) {
            clearFile()
            return
          }
          setUploadedFile(file)
          setForm(prev => ({ ...prev, name: file.name, file }))
        }}
        actionLabel={t('fileAddPage.uploadFile', 'Upload File')}
        actionLoadingLabel={t('fileAddPage.uploading', 'Uploading...')}
        actionLoading={loading}
        actionDisabled={!uploadedFile || !form.name || loading}
        onSubmit={handleSubmit}
      />
    </Body>
  )
}
