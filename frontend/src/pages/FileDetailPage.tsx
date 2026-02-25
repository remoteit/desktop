import React, { useState, useEffect } from 'react'
import { useParams, Redirect } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { selectFile } from '../selectors/scripting'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { FileDeleteButton } from '../components/FileDeleteButton'
import { Container } from '../components/Container'
import { FileEditorForm } from '../components/FileEditorForm'

export const FileDetailPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { fileID } = useParams<{ fileID: string }>()

  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const fetching = useSelector((state: State) => state.files.fetching)

  const [form, setForm] = useState<IFileForm | undefined>()
  const [defaultForm, setDefaultForm] = useState<IFileForm | undefined>()
  const [saving, setSaving] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | undefined>()

  // Initialize form
  useEffect(() => {
    if (!file) return
    const setupForm: IFileForm = {
      ...role,
      ...initialForm,
      fileId: file.id,
      name: file.name,
      description: file.shortDesc || '',
      executable: false, // Non-executable files
    }
    setDefaultForm(setupForm)
    setForm(setupForm)
    setUploadedFile(undefined)
  }, [fileID, file?.id])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || !file) return
    setSaving(true)

    const metadataChanged = form.name !== defaultForm?.name || form.description !== defaultForm?.description

    if (uploadedFile) {
      // New file uploaded - upload new version (includes metadata)
      const uploadForm: IFileForm = {
        ...form,
        executable: false,
        file: uploadedFile,
      }
      await dispatch.files.upload(uploadForm)
      setUploadedFile(undefined)
    } else if (metadataChanged) {
      // Only metadata changed - use updateMetadata mutation (no new version)
      await dispatch.files.updateMetadata({
        fileId: file.id,
        name: form.name,
        shortDesc: form.description,
      })
    }

    setSaving(false)
    setDefaultForm(form)
  }

  // Can save when there's a new file or metadata has changed
  const metadataChanged = form && defaultForm && (form.name !== defaultForm.name || form.description !== defaultForm.description)
  const canSave = form && (!!uploadedFile || metadataChanged)

  if (!file) {
    return <Redirect to="/files" />
  }

  if (!form) return null

  return (
    <Container bodyProps={{ inset: true, gutterTop: true, gutterBottom: true, verticalOverflow: true }}>
      <FileEditorForm
        title={file.name}
        titleAction={<FileDeleteButton />}
        form={{ name: form.name, description: form.description }}
        disabled={!manager}
        showUpload={manager}
        uploadLabel="Upload New Version"
        uploadedFile={uploadedFile || null}
        onFormChange={changes => setForm(prev => (prev ? { ...prev, ...changes } : prev))}
        onUploadedFileChange={file => {
          setUploadedFile(file)
          if (file && form.name === defaultForm?.name) {
            setForm(prev => (prev ? { ...prev, name: file.name } : prev))
          }
        }}
        actionLabel="Save"
        actionLoadingLabel="Saving..."
        showAction={manager}
        actionLoading={saving}
        actionDisabled={!canSave || saving || fetching}
        onSubmit={handleSave}
      />
    </Container>
  )
}
