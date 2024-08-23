import React, { useCallback, useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Typography, TextField, Box, ButtonBase, Stack, Divider } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Dispatch } from '../store'
import { spacing, radius } from '../styling'

export const FileUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const { ui } = useDispatch<Dispatch>()
  const [filename, setFilename] = useState<string>()
  const [script, setScript] = useState<string>()

  const onDrop = useCallback((files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader()
      let result = ''
      reader.onabort = () => ui.set({ errorMessage: 'File reading was aborted' })
      reader.onerror = () => ui.set({ errorMessage: 'File reading has failed' })
      reader.onload = () => (result += reader.result)
      reader.onloadend = () => {
        setScript(result)
        onUpload(file)
        setFilename(file.name)
      }
      reader.readAsText(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const css = useStyles({ isDragActive })

  const uploadEl = filename ? (
    <Box className={css.paper}>
      <Typography variant="body2" color="textSecondary">
        <b>{filename}</b> uploaded
      </Typography>
      <IconButton
        name="times"
        title="Clear"
        color="grayDark"
        size="sm"
        onClick={() => {
          setFilename(undefined)
          setScript('')
        }}
      />
    </Box>
  ) : (
    <ButtonBase className={css.paper} {...getRootProps()}>
      <input {...getInputProps()} />
      <Box>
        <Typography variant="body2">Upload</Typography>
        <Typography variant="caption">Drag and drop or click </Typography>
      </Box>
    </ButtonBase>
  )

  return (
    <Stack width="100%">
      {uploadEl}
      <Divider />
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
            borderRadius: `0 0 ${radius.sm}px ${radius.sm}px`,
          }),
        }}
        onChange={event => setScript(event.target.value)}
      />
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
