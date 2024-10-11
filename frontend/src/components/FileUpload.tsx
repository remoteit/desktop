import React, { useCallback, useState, useEffect } from 'react'
import { BINARY_DATA_TOKEN } from '../constants'
import { makeStyles } from '@mui/styles'
import { containsNonPrintableChars } from '../helpers/utilHelper'
import { Typography, TextField, Box, ButtonBase, Stack, Divider } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Dispatch } from '../store'
import { Notice } from './Notice'
import { spacing, radius } from '../styling'

type Props = {
  script?: string
  loading?: boolean
  onChange: (script: string) => void
  onUpload: (file: File) => void
}

export const FileUpload: React.FC<Props> = ({ script = '', loading, onChange, onUpload }) => {
  const { ui } = useDispatch<Dispatch>()
  const [filename, setFilename] = useState<string | undefined>()
  const [isText, setIsText] = useState(true)

  useEffect(() => {
    if (script === BINARY_DATA_TOKEN) setIsText(false)
  }, [script])

  const onDrop = useCallback((files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader()

      reader.onabort = () => ui.set({ errorMessage: 'File reading was aborted' })
      reader.onerror = () => ui.set({ errorMessage: 'File reading has failed' })
      reader.onloadend = () => {
        const buffer = new Uint8Array(reader.result as ArrayBuffer)

        try {
          const text = new TextDecoder().decode(buffer)
          const isBinary = containsNonPrintableChars(text)

          if (!isBinary) {
            onChange(text)
            onUpload(file)
            setFilename(file.name)
            setIsText(true)
          } else {
            setIsText(false)
          }
        } catch (e) {
          console.error('Error decoding text:', e)
          ui.set({ errorMessage: 'File could not be decoded as text.' })
          setIsText(false)
        }
      }

      reader.readAsArrayBuffer(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const css = useStyles({ isDragActive })
  const showUpload = !filename && isText

  const clear = () => {
    setFilename(undefined)
    onChange('')
    setIsText(true)
  }

  return (
    <Stack width="100%" position="relative">
      {isText ? (
        <>
          <TextField
            multiline
            fullWidth
            required
            disabled={loading}
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
          {filename && (
            <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
              <IconButton
                name="times"
                title="Clear"
                color="grayDark"
                size="sm"
                onClick={() => {
                  setFilename(undefined)
                  onChange('')
                  setIsText(true)
                }}
              />
            </Box>
          )}
        </>
      ) : (
        <Notice onClose={clear} closeTitle="Clear" fullWidth>
          This script appears to be binary.
        </Notice>
      )}
      {showUpload && (
        <>
          <Divider />
          <ButtonBase className={css.paper} {...getRootProps()}>
            <input {...getInputProps()} />
            <Box>
              <Typography variant="body2">Upload</Typography>
              <Typography variant="caption">Drag and drop or click </Typography>
            </Box>
          </ButtonBase>
        </>
      )}
    </Stack>
  )
}

type styleProps = { isDragActive: boolean }

const useStyles = makeStyles(({ palette }) => ({
  paper: ({ isDragActive }: styleProps) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px dotted ${isDragActive ? palette.primary.main : palette.grayLightest.main}`,
    background: palette.grayLightest.main,
    padding: `${spacing.md}px ${spacing.xl}px`,
    borderRadius: `0 0 ${radius.sm}px ${radius.sm}px`,
    minWidth: 200,
    '&:hover': { background: palette.primaryHighlight.main, borderColor: palette.primaryHighlight.main },
  }),
}))
