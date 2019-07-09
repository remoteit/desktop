import React, { useRef } from 'react'
import {
  Paper,
  FormControl,
  InputBase,
  IconButton,
  Tooltip,
} from '@material-ui/core'
import { Icon } from '../Icon'

export interface Props {
  onSubmit?: (query: string) => void
  onChange?: (query: string) => void
  initialValue?: string
  searching: boolean
}

export function SearchField({
  initialValue,
  onSubmit,
  onChange,
  searching = false,
  ...props
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const hasValue = initialValue || (input.current && input.current.value)
  return (
    <Paper className="px-xs py-xxs df ai-center w-100" elevation={1} {...props}>
      <form
        onSubmit={e => {
          if (!onSubmit) return
          e.preventDefault()
          if (!input || !input.current) return
          onSubmit(input.current.value)
        }}
        className="w-100"
      >
        <FormControl className="w-100 df ai-center fd-row">
          <InputBase
            autoFocus
            disabled={searching}
            className="px-sm py-xs w-100"
            onChange={e => {
              if (!onChange) return
              e.preventDefault()
              if (!input || !input.current) return
              onChange(input.current.value)
            }}
            id="input-with-icon-adornment"
            placeholder="Search devices and services..."
            inputRef={input}
            defaultValue={initialValue}
          />
          {hasValue && (
            <Tooltip title="Clear search">
              <IconButton
                className="p-sm"
                type="button"
                onClick={() => {
                  if (!input.current || !input.current.value) return
                  input.current.value = ''
                  if (onChange) onChange('')
                }}
              >
                <Icon name="times" size="sm" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Search">
            <IconButton
              className="p-sm"
              type="submit"
              disabled={
                searching || Boolean(!input.current || !input.current.value)
              }
            >
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
