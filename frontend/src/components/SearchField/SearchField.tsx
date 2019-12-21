import React from 'react'
import { InputBase, IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import { spacing, colors } from '../../styling'

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
  const css = useStyles()

  return (
    <form
      {...props}
      className={css.field}
      onSubmit={e => {
        e.preventDefault()
        if (searchOnly && onSubmit) {
          onSubmit()
        }
      }}
    >
      <InputBase
        autoFocus
        className={css.input}
        onChange={e => onChange(e.target.value)}
        id="input-with-icon-adornment"
        placeholder="Search devices and services..."
        value={value}
      />
      <div className={css.icons}>
        {value && (
          <Tooltip title="Clear search">
            <IconButton type="button" onClick={() => onChange('')}>
              <Icon name="times" size="sm" weight="regular" color="grayDarker" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Search">
          <span>
            <IconButton type="submit" disabled={disabled}>
              <Icon
                name={searching ? 'spinner-third' : 'search'}
                spin={searching}
                size="sm"
                weight="regular"
                color="grayDarker"
              />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </form>
  )
}

const useStyles = makeStyles({
  field: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    width: '100%',
    backgroundColor: colors.grayLighter,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginRight: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    transition: 'background-color 300ms',
    '&:focus,&:hover': {
      backgroundColor: colors.grayLight,
    },
  },
  icons: {
    position: 'absolute',
    right: spacing.lg,
  },
})
