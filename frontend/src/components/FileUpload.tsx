import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles, Typography, Box, ButtonBase } from '@material-ui/core'
import { spacing } from '../styling'

export const FileUpload: React.FC<{ onUpload: (data: any) => void }> = ({ onUpload }) => {
  const { ui } = useDispatch<Dispatch>()
  const onDrop = useCallback(files => {
    files.forEach(file => {
      const reader = new FileReader()
      let result = ''
      reader.onabort = () => ui.set({ errorMessage: 'File reading was aborted' })
      reader.onerror = () => ui.set({ errorMessage: 'File reading has failed' })
      reader.onload = () => (result += reader.result)
      reader.onloadend = () => onUpload(result)
      reader.readAsText(file)
    })
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const css = useStyles({ isDragActive })

  return (
    <ButtonBase className={css.paper} {...getRootProps()}>
      <input {...getInputProps()} />
      <Box>
        <Typography variant="body2">Upload SAML metadata file</Typography>
        <Typography variant="caption">Drag and drop or click </Typography>
      </Box>
    </ButtonBase>
  )
}

type styleProps = { isDragActive: boolean }

const useStyles = makeStyles(({ palette }) => ({
  paper: ({ isDragActive }: styleProps) => ({
    border: `2px dotted ${isDragActive ? palette.primary.main : palette.grayLightest.main}`,
    background: palette.grayLightest.main,
    padding: `${spacing.lg}px ${spacing.xl}px`,
    width: '100%',
    '&:hover': { background: palette.primaryHighlight.main, borderColor: palette.primaryHighlight.main },
  }),
}))
