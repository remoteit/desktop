import React, { useRef } from 'react'
import { Paper, FormControl, InputBase, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'

export interface Props {
  search: (query: string) => void
  searching: boolean
}

export function SearchField({ search, searching = false, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <Paper className="px-xs py-xxs df ai-center w-100" elevation={1} {...props}>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!input || !input.current) return
          search(input.current.value)
        }}
        className="w-100"
      >
        <FormControl className="w-100 df ai-center fd-row">
          <InputBase
            autoFocus
            disabled={searching}
            className="px-sm py-xs w-100"
            id="input-with-icon-adornment"
            placeholder="Search devices and services..."
            inputRef={input}
          />

          <IconButton className="p-sm" type="submit" disabled={searching}>
            <Icon
              name={searching ? 'spinner-third' : 'search'}
              spin={searching}
              size="sm"
            />
          </IconButton>
        </FormControl>
      </form>
    </Paper>
  )
}
