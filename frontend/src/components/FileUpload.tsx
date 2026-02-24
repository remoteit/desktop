import React, { useMemo, useState } from 'react'
import { BINARY_DATA_TOKEN } from '../constants'
import { Typography, TextField, Box, ButtonBase, Stack, Divider } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Dispatch } from '../store'
import { Notice } from './Notice'
import { radius } from '../styling'
import {
  buildDropzoneAcceptFromExtensions,
  containsBinaryData,
  readFileAsArrayBuffer,
  readFileAsText,
} from '../helpers/fileUpload'

export type FileUploadActionApi = {
  value: string | File | null | undefined
  setValue: (next: string | File | null | undefined) => void
  clear: () => void
  insertText: (text: string) => void
  replaceText: (text: string) => void
}

type BaseProps = {
  attached?: boolean
  disabled?: boolean
  loading?: boolean
  label?: string
  subLabel?: string
  allowedExtensions?: string[]
  topActions?: (api: FileUploadActionApi) => React.ReactNode
}

type ScriptProps = BaseProps & {
  mode: 'script'
  value?: string
  onChange: (script: string, file?: File) => void
}

type FileProps = BaseProps & {
  mode: 'file'
  value?: File | null
  onChange: (file: File | undefined) => void
}

type TextProps = BaseProps & {
  mode: 'text'
  value?: string
  onChange: (text: string | undefined, file?: File) => void
}

type Props = ScriptProps | FileProps | TextProps

export const FileUpload: React.FC<Props> = props => {
  const dispatch = useDispatch<Dispatch>()
  const [uploadedFilename, setUploadedFilename] = useState<string>()
  const isScriptMode = props.mode === 'script'
  const isFileMode = props.mode === 'file'
  const isTextMode = props.mode === 'text'

  const accept = useMemo(() => buildDropzoneAcceptFromExtensions(props.allowedExtensions), [props.allowedExtensions])

  const setEmptyValue = () => {
    switch (props.mode) {
      case 'script':
        props.onChange('')
        return
      case 'text':
        props.onChange(undefined)
        return
      case 'file':
        props.onChange(undefined)
        return
    }
  }

  const setTextValue = (text: string) => {
    switch (props.mode) {
      case 'script':
        props.onChange(text)
        return
      case 'text':
        props.onChange(text)
        return
      case 'file':
        return
    }
  }

  const clear = () => {
    setUploadedFilename(undefined)
    setEmptyValue()
  }

  const setActionValue = (next: string | File | null | undefined) => {
    switch (props.mode) {
      case 'script':
        props.onChange(typeof next === 'string' ? next : '')
        return
      case 'text':
        props.onChange(typeof next === 'string' ? next : undefined)
        return
      case 'file':
        props.onChange(next instanceof File ? next : undefined)
        return
    }
  }

  const currentValue = isFileMode ? props.value ?? null : props.value
  const actionApi: FileUploadActionApi = {
    value: currentValue,
    setValue: setActionValue,
    clear,
    insertText: text => {
      if (isFileMode) return
      const current = props.value || ''
      setTextValue(current ? `${text}${current}` : text)
    },
    replaceText: text => {
      if (isFileMode) return
      setTextValue(text)
    },
  }

  const onDrop = async (files: File[]) => {
    if (!files.length) return
    const file = files[0]
    try {
      setUploadedFilename(file.name)
      if (isScriptMode) {
        const buffer = await readFileAsArrayBuffer(file)
        if (containsBinaryData(buffer)) {
          props.onChange(BINARY_DATA_TOKEN, file)
        } else {
          const text = new TextDecoder().decode(new Uint8Array(buffer))
          props.onChange(text, file)
        }
        return
      }
      if (isTextMode) {
        const text = await readFileAsText(file)
        props.onChange(text, file)
        return
      }
      props.onChange(file)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File reading has failed'
      dispatch.ui.set({ errorMessage: message })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
  })

  const isScriptBinary = isScriptMode && props.value === BINARY_DATA_TOKEN
  const showScriptEditor = isScriptMode && !isScriptBinary
  const canClear = isScriptMode ? !!uploadedFilename : !!props.value || !!uploadedFilename
  const showActions = !!props.topActions || canClear

  const uploadLabel = props.label || (isTextMode ? 'Select File' : 'Upload')
  const uploadSubLabel = props.subLabel || 'Drag and drop or click'
  const selectedFile = isFileMode ? props.value : undefined

  return (
    <Stack width="100%" position="relative">
      <ButtonBase
        {...getRootProps()}
        disabled={props.disabled}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dotted',
          borderColor: isDragActive ? 'primary.main' : 'grayLightest.main',
          backgroundColor: 'grayLightest.main',
          padding: 2,
          borderRadius: props.attached ? `${radius.sm}px ${radius.sm}px 0 0` : `${radius.sm}px`,
          minWidth: 200,
          minHeight: 80,
          '&:hover': { backgroundColor: 'primaryHighlight.main', borderColor: 'primaryHighlight.main' },
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="body2">{uploadLabel}</Typography>
        <Typography variant="caption" color="textSecondary">
          {uploadSubLabel}
        </Typography>
        {(selectedFile || uploadedFilename) && !isScriptMode && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
            {(selectedFile?.name || uploadedFilename) ?? ''} selected
          </Typography>
        )}
      </ButtonBase>

      {props.attached && <Divider sx={{ borderColor: 'grayLight.main' }} />}

      {isScriptMode && showScriptEditor && (
        <TextField
          multiline
          fullWidth
          required
          disabled={props.disabled || props.loading}
          label="Script"
          value={props.loading ? 'loading...' : props.value?.toString() || ''}
          variant="filled"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: theme => ({
              borderRadius: props.attached ? `0 0 ${radius.sm}px ${radius.sm}px` : undefined,
              fontFamily: "'Roboto Mono', monospace",
              fontSize: theme.typography.caption.fontSize,
              lineHeight: theme.typography.caption.lineHeight,
              color: theme.palette.grayDarkest.main,
            }),
          }}
          inputProps={{ sx: { transition: 'height 600ms' } }}
          onChange={event => props.onChange(event.target.value)}
        />
      )}

      {isScriptMode && isScriptBinary && (
        <Notice onClose={clear} closeTitle="Clear" fullWidth>
          Binary script uploaded
          {uploadedFilename ? (
            <>
              : <strong>{uploadedFilename}</strong>
            </>
          ) : null}
        </Notice>
      )}

      {showActions && (
        <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
          {props.topActions?.(actionApi)}
          {canClear && <IconButton name="times" title="Clear" color="grayDark" size="sm" onClick={clear} />}
        </Box>
      )}
    </Stack>
  )
}
