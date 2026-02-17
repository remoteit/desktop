import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TextField, MenuItem, Typography, Box, ButtonBase, Stack, Divider } from '@mui/material'
import { State, Dispatch } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { useDropzone } from 'react-dropzone'
import { radius } from '../styling'

type Props = {
  arguments: IFileArgument[]
  values: IArgumentValue[]
  onChange: (values: IArgumentValue[]) => void
  disabled?: boolean
}

// Helper to find a file by either file ID or version ID
const findFileByIdOrVersionId = (files: IFile[], id: string): IFile | undefined => {
  // First try to find by file ID
  const byFileId = files.find(f => f.id === id)
  if (byFileId) return byFileId
  
  // Then try to find by version ID (FileSelect arguments store version IDs)
  return files.find(f => f.versions?.some(v => v.id === id))
}

export const ArgumentsValueForm: React.FC<Props> = ({ arguments: argDefs, values, onChange, disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  
  // Get ALL files (both scripts and non-scripts) for FileSelect type
  const accountId = useSelector(selectActiveAccountId)
  const files = useSelector((state: State) => state.files.all[accountId] || [])
  
  // Sort arguments by order
  const sortedArgs = [...argDefs].sort((a, b) => a.order - b.order)

  const getValue = (name: string): string => {
    return values.find(v => v.name === name)?.value || ''
  }

  const setValue = (name: string, value: string) => {
    const existing = values.find(v => v.name === name)
    if (existing) {
      onChange(values.map(v => (v.name === name ? { ...v, value } : v)))
    } else {
      onChange([...values, { name, value }])
    }
  }

  if (sortedArgs.length === 0) {
    return null
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Script Arguments
      </Typography>
      <Stack spacing={1}>
        {sortedArgs.map(arg => (
          <Box
            key={arg.name}
            sx={{
              borderLeft: 3,
              borderColor: 'grayLighter.main',
              pl: 1.5,
              py: 0.5,
            }}
          >
            <ArgumentInput
              argument={arg}
              value={getValue(arg.name)}
              onChange={value => setValue(arg.name, value)}
              disabled={disabled}
              files={files}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

type ArgumentInputProps = {
  argument: IFileArgument
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  files: IFile[]
}

const ArgumentInput: React.FC<ArgumentInputProps> = ({ argument, value, onChange, disabled, files }) => {
  const { name, desc, argumentType, options } = argument
  const dispatch = useDispatch<Dispatch>()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const reader = new FileReader()

      reader.onabort = () => dispatch.ui.set({ errorMessage: 'File reading was aborted' })
      reader.onerror = () => dispatch.ui.set({ errorMessage: 'File reading has failed' })
      reader.onloadend = async () => {
        // Upload the file and get the file ID
        const fileId = await dispatch.files.upload({
          name: file.name,
          description: '',
          executable: false,
          deviceIds: [],
          access: 'NONE',
          fileId: '',
          file,
        })
        if (fileId) {
          onChange(fileId)
        }
      }

      reader.readAsArrayBuffer(file)
    }
  }, [dispatch, onChange])

  // Map common file extensions to MIME types for file picker
  const getMimeTypes = (extensions: string[]) => {
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    }

    const accept: Record<string, string[]> = {}
    extensions.forEach(ext => {
      const cleanExt = ext.startsWith('.') ? ext : `.${ext}`
      const mime = mimeMap[cleanExt.toLowerCase()]
      if (mime) {
        if (!accept[mime]) accept[mime] = []
        accept[mime].push(cleanExt)
      }
    })
    return Object.keys(accept).length > 0 ? accept : undefined
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: argumentType === 'FileSelect' && options.length > 0 ? getMimeTypes(options) : undefined,
  })

  switch (argumentType) {
    case 'StringEntry':
      return (
        <TextField
          fullWidth
          label={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          helperText={desc}
          variant="filled"
        />
      )

    case 'StringSelect':
      return (
        <TextField
          select
          fullWidth
          label={name}
          value={value || '_none_'}
          onChange={e => onChange(e.target.value === '_none_' ? '' : e.target.value)}
          disabled={disabled}
          helperText={desc}
          variant="filled"
        >
          <MenuItem value="_none_">
            <em>Select...</em>
          </MenuItem>
          {options.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      )

    case 'FileSelect':
      // Filter to non-executable files only, and optionally by file extension
      const filteredFiles = files.filter(f => {
        if (f.executable) return false
        if (options.length === 0) return true
        // Check if file extension matches allowed types
        const ext = f.name.split('.').pop()?.toLowerCase()
        return options.some(opt => {
          const allowedExt = opt.replace(/^\*?\.?/, '').toLowerCase()
          return ext === allowedExt
        })
      })
      
      // Find the currently selected file - value could be file ID or version ID
      const selectedFile = findFileByIdOrVersionId(files, value)
      
      // Ensure selected file is always in the list, even if it doesn't match filter
      const availableFiles = selectedFile && !filteredFiles.find(f => f.id === selectedFile.id)
        ? [selectedFile, ...filteredFiles]
        : filteredFiles
      
      // Check if we have a value but the file wasn't found (deleted or inaccessible)
      const fileMissing = value && !selectedFile
        
      const fileHelperText = [
        desc, 
        options.length > 0 ? `Allowed types: ${options.join(', ')}` : '',
        fileMissing ? '⚠️ Previously selected file is no longer available' : ''
      ]
        .filter(Boolean)
        .join(' | ')

      // Get the latest version ID for a file (used as the stored value)
      const getLatestVersionId = (file: IFile): string => {
        return file.versions?.[0]?.id || file.id
      }
      
      // For the dropdown, use the selected file's latest version ID if found
      const dropdownValue = selectedFile ? getLatestVersionId(selectedFile) : '_none_'

      return (
        <Stack spacing={0}>
          {/* Dropdown to select existing file */}
          <TextField
            select
            fullWidth
            label={name}
            value={dropdownValue}
            onChange={e => onChange(e.target.value === '_none_' ? '' : e.target.value)}
            disabled={disabled}
            helperText={fileHelperText}
            variant="filled"
          >
            <MenuItem value="_none_">
              <em>Select existing file...</em>
            </MenuItem>
            {availableFiles.map(file => (
              <MenuItem key={file.id} value={getLatestVersionId(file)}>
                {file.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Upload option — compact */}
          <ButtonBase
            {...getRootProps()}
            disabled={disabled}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 0.5,
              py: 0.75,
              borderRadius: `${radius.sm}px`,
              border: '1px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grayLighter.main',
              backgroundColor: isDragActive ? 'primaryHighlight.main' : 'transparent',
              transition: 'all 0.15s ease',
              '&:hover': { backgroundColor: 'primaryHighlight.main', borderColor: 'primary.main' },
            }}
          >
            <input {...getInputProps()} />
            <Typography variant="caption" color="textSecondary">
              or upload new file
            </Typography>
          </ButtonBase>
        </Stack>
      )

    default:
      return (
        <TextField
          fullWidth
          label={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          helperText={desc || `Unknown type: ${argumentType}`}
          variant="filled"
        />
      )
  }
}
