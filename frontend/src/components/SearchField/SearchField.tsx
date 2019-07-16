import React, { useRef } from 'react'
import {
  Paper,
  FormControl,
  InputBase,
  IconButton,
  Tooltip,
} from '@material-ui/core'
import { Icon } from '../Icon'

export interface SearchFieldProps {
  onSubmit?: () => void
  onChange: (query: string) => void
  value?: string
  searching: boolean
  searchOnly: boolean
}

export function SearchField({
  value,
  onSubmit,
  onChange,
  searching = false,
  searchOnly = false,
  ...props
}: SearchFieldProps) {
  const disabled = Boolean(searching || !value)

  return (
    <Paper className="px-xs py-xxs df ai-center w-100" elevation={1} {...props}>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (searchOnly && onSubmit) {
            onSubmit()
          }
        }}
        className="w-100"
      >
        <FormControl className="w-100 df ai-center fd-row">
          <InputBase
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            className="px-sm py-xs w-100"
            onChange={e => onChange(e.target.value)}
            id="input-with-icon-adornment"
            placeholder="Search devices and services..."
            value={value}
          />
          {value && (
            <Tooltip title="Clear search">
              <IconButton
                className="p-sm"
                type="button"
                onClick={() => onChange('')}
              >
                <Icon name="times" size="sm" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Search">
            <IconButton className="p-sm" type="submit" disabled={disabled}>
              <Icon
                name={searching ? 'spinner-third' : 'search'}
                spin={searching}
                size="sm"
              />
            </IconButton>
          </Tooltip>
        </FormControl>
      </form>
    </Paper>
  )
}
