import React, { useCallback, useState } from 'react'
import { makeStyles } from '@mui/styles'
import { containsNonPrintableChars } from '../helpers/utilHelper'
import { Typography, TextField, Box, ButtonBase, Stack, Divider } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Dispatch } from '../store'
import { Notice } from './Notice'
import { spacing, radius } from '../styling'

export const FileUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const { ui } = useDispatch<Dispatch>()
  const [filename, setFilename] = useState<string>()
  const [script, setScript] = useState<string>()
  const [isText, setIsText] = useState(true)

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
            setScript(text)
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

      reader.readAsArrayBuffer(file) // Read as ArrayBuffer to handle both text and binary files
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const css = useStyles({ isDragActive })
  const showUpload = !filename && isText

  const clear = () => {
    setFilename(undefined)
    setScript('')
    setIsText(true)
  }

  return (
    <Stack width="100%" position="relative">
      {showUpload && (
        <>
          <ButtonBase className={css.paper} {...getRootProps()}>
            <input {...getInputProps()} />
            <Box>
              <Typography variant="body2">Upload</Typography>
              <Typography variant="caption">Drag and drop or click </Typography>
            </Box>
          </ButtonBase>
          <Divider />
        </>
      )}
      {isText ? (
        <>
          <TextField
            multiline
            fullWidth
            required
            label="Script"
            value={script}
            variant="filled"
            maxRows={20}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: theme => ({
                fontFamily: "'Roboto Mono', monospace",
                fontSize: theme.typography.caption.fontSize,
                borderRadius: showUpload ? `0 0 ${radius.sm}px ${radius.sm}px` : undefined,
              }),
            }}
            onChange={event => setScript(event.target.value)}
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
                  setScript('')
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
    padding: `${spacing.lg}px ${spacing.xl}px`,
    borderRadius: `${radius.sm}px ${radius.sm}px 0 0`,
    minWidth: 200,
    '&:hover': { background: palette.primaryHighlight.main, borderColor: palette.primaryHighlight.main },
  }),
}))
