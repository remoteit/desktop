import React, { useState } from 'react'
import { Typography } from '@mui/material'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Body } from '../components/Body'
import { Dispatch } from '../store'
import { FileEditorForm } from '../components/FileEditorForm'

type Props = { center?: boolean }

export const FileAddPage: React.FC<Props> = ({ center }) => {
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
          You do not have permission to upload files
        </Typography>
      </Body>
    )
  }

  return (
    <Body center={center} inset gutterTop gutterBottom>
      <FileEditorForm
        title="Upload File"
        form={{ name: form.name, description: form.description }}
        uploadLabel="Upload File"
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
        actionLabel="Upload File"
        actionLoadingLabel="Uploading..."
        actionLoading={loading}
        actionDisabled={!uploadedFile || !form.name || loading}
        onSubmit={handleSubmit}
      />
    </Body>
  )
}
