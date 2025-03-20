import React, { useCallback, useState, useEffect } from 'react'
import { BINARY_DATA_TOKEN } from '../constants'
import { containsNonPrintableChars } from '../helpers/utilHelper'
import { Typography, TextField, Box, ButtonBase, Stack, Divider } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Dispatch } from '../store'
import { Notice } from './Notice'
import { radius } from '../styling'

type Props = {
  script?: string
  loading?: boolean
  disabled?: boolean
  onChange: (script: string, file?: File) => void
}

export const FileUpload: React.FC<Props> = ({ script = '', loading, disabled, onChange }) => {
  const dispatch = useDispatch<Dispatch>()
  const [filename, setFilename] = useState<string | undefined>()
  const [isText, setIsText] = useState(true)

  useEffect(() => {
    if (script === BINARY_DATA_TOKEN) setIsText(false)
  }, [script])

  const onDrop = useCallback((files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader()

      reader.onabort = () => dispatch.ui.set({ errorMessage: 'File reading was aborted' })
      reader.onerror = () => dispatch.ui.set({ errorMessage: 'File reading has failed' })
      reader.onloadend = () => {
        const buffer = new Uint8Array(reader.result as ArrayBuffer)

        try {
          const text = new TextDecoder().decode(buffer)
          const isBinary = containsNonPrintableChars(text)

          if (!isBinary) {
            setIsText(true)
            setFilename(file.name)
            onChange(text, file)
          } else {
            setIsText(false)
          }
        } catch (e) {
          console.error('Error decoding text:', e)
          dispatch.ui.set({ errorMessage: 'File could not be decoded as text.' })
          setIsText(false)
        }
      }

      reader.readAsArrayBuffer(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const showUpload = !filename && isText

  const clear = () => {
    setFilename(undefined)
    onChange('')
    setIsText(true)
  }

  const paste = async () => {
    const demo = await dispatch.files.downloadDemoScript()
    onChange(demo + '\n\n' + script)
  }

  return (
    <Stack width="100%" position="relative">
      {isText ? (
        <>
          <TextField
            multiline
            fullWidth
            required
            disabled={disabled || loading}
            label="Script"
            value={loading ? 'loading...' : script.toString()}
            variant="filled"
            maxRows={30}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: theme => ({
                borderRadius: showUpload ? `${radius.sm}px ${radius.sm}px 0 0` : undefined,
                fontFamily: "'Roboto Mono', monospace",
                fontSize: theme.typography.caption.fontSize,
                lineHeight: theme.typography.caption.lineHeight,
                color: theme.palette.grayDarkest.main,
              }),
            }}
            inputProps={{ sx: { transition: 'height 600ms' } }}
            onChange={event => onChange(event.target.value)}
          />
          <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
            {filename ? (
              <IconButton name="times" title="Clear" color="grayDark" size="sm" onClick={clear} />
            ) : (
              <IconButton name="terminal" title="Add Demo Script" color="grayDark" size="sm" onClick={paste} />
            )}
          </Box>
        </>
      ) : (
        <Notice onClose={clear} closeTitle="Clear" fullWidth>
          This script appears to be binary.
        </Notice>
      )}
      {showUpload && (
        <>
          <Divider sx={{ borderColor: 'grayLight.main' }} />
          <ButtonBase
            {...getRootProps()}
            disabled={disabled}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dotted',
              borderColor: isDragActive ? 'primary.main' : 'grayLightest.main',
              backgroundColor: 'grayLightest.main',
              padding: 2,
              borderRadius: `0 0 ${radius.sm}px ${radius.sm}px`,
              minWidth: 200,
              '&:hover': { backgroundColor: 'primaryHighlight.main', borderColor: 'primaryHighlight.main' },
            }}
          >
            <input {...getInputProps()} />
            <Typography variant="body2">Upload</Typography>
            <Typography variant="caption">Drag and drop or click </Typography>
          </ButtonBase>
        </>
      )}
    </Stack>
  )
}
