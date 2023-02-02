import React, { useCallback, useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Typography, Box, ButtonBase } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Dispatch } from '../store'
import { spacing, radius } from '../styling'

export const FileUpload: React.FC<{ onUpload: (data: any) => void }> = ({ onUpload }) => {
  const { ui } = useDispatch<Dispatch>()
  const [filename, setFilename] = useState<string>()
  const onDrop = useCallback(files => {
    files.forEach(file => {
      const reader = new FileReader()
      let result = ''
      reader.onabort = () => ui.set({ errorMessage: 'File reading was aborted' })
      reader.onerror = () => ui.set({ errorMessage: 'File reading has failed' })
      reader.onload = () => (result += reader.result)
      reader.onloadend = () => {
        onUpload(result)
        setFilename(file.name)
      }
      reader.readAsText(file)
    })
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const css = useStyles({ isDragActive })

  if (filename)
    return (
      <Box className={css.paper}>
        <Typography variant="body2" color="textSecondary">
          <b>{filename}</b> selected
        </Typography>
        <IconButton
          name="times"
          title="Clear"
          color="grayDark"
          size="sm"
          onClick={() => {
            setFilename(undefined)
            onUpload(undefined)
          }}
        />
      </Box>
    )
  return (
    <ButtonBase className={css.paper} {...getRootProps()}>
      <input {...getInputProps()} />
      <Box>
        <Typography variant="body2">Select SAML metadata file</Typography>
        <Typography variant="caption">Drag and drop or click </Typography>
      </Box>
    </ButtonBase>
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
    borderRadius: radius,
    minWidth: 400,
    '&:hover': { background: palette.primaryHighlight.main, borderColor: palette.primaryHighlight.main },
  }),
}))
