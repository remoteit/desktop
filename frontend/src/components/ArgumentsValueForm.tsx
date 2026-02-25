import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TextField, MenuItem, Typography, Box, Stack } from '@mui/material'
import { State, Dispatch } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { Quote } from './Quote'
import { FileUpload } from './FileUpload'
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
      <Typography variant="subtitle2" marginTop={3} marginBottom={1}>
        Script Arguments
      </Typography>
      <Quote margin={null}>
        <Stack spacing={1}>
          {sortedArgs.map(arg => (
            <Box key={arg.name} sx={{ py: 0.5 }}>
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
      </Quote>
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
          <MenuItem value="_none_" disabled>
            <em>Select ...</em>
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
      const availableFiles =
        selectedFile && !filteredFiles.find(f => f.id === selectedFile.id)
          ? [selectedFile, ...filteredFiles]
          : filteredFiles

      // Check if we have a value but the file wasn't found (deleted or inaccessible)
      const fileMissing = value && !selectedFile

      const fileHelperText = [
        desc,
        options.length > 0 ? `Allowed types: ${options.join(', ')}` : '',
        fileMissing ? '⚠️ Previously selected file is no longer available' : '',
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
        <Stack>
          <FileUpload
            mode="file"
            attached
            label="Upload file"
            subLabel="Drag and drop or click"
            allowedExtensions={options}
            disabled={disabled}
            onChange={async file => {
              if (!file) return
              const fileId = await dispatch.files.upload({
                name: file.name,
                description: '',
                executable: false,
                deviceIds: [],
                access: 'NONE',
                fileId: '',
                file,
              })
              if (fileId) onChange(fileId)
            }}
          />

          <TextField
            select
            fullWidth
            label={name}
            value={dropdownValue}
            onChange={e => onChange(e.target.value === '_none_' ? '' : e.target.value)}
            disabled={disabled}
            helperText={fileHelperText}
            variant="filled"
            InputProps={{
              sx: { borderRadius: `0 0 ${radius.sm}px ${radius.sm}px` },
            }}
          >
            <MenuItem value="_none_" disabled>
              <em>Select existing file ...</em>
            </MenuItem>
            {availableFiles.map(file => (
              <MenuItem key={file.id} value={getLatestVersionId(file)}>
                {file.name}
              </MenuItem>
            ))}
          </TextField>
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
