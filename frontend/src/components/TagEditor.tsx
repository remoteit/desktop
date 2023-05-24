import React, { useEffect } from 'react'
import { makeStyles } from '@mui/styles'
import { Chip, Tooltip } from '@mui/material'
import { TagAutocomplete } from './TagAutocomplete'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { useLabel } from '../hooks/useLabel'
import { Icon } from './Icon'

type Props = {
  tags?: ITag[]
  filter?: ITag[]
  label?: string
  placeholder?: string
  allowAdding?: boolean
  hideIcons?: boolean
  createOnly?: boolean
  button?: string
  buttonProps?: ButtonProps
  disabled?: boolean
  keyboardShortcut?: boolean
  onCreate?: (tag: ITag) => void
  onSelect?: (tag: ITag) => void
}

export const TagEditor: React.FC<Props> = ({
  tags = [],
  filter = [],
  label = 'TAG',
  placeholder = 'New tag...',
  allowAdding = true,
  hideIcons,
  createOnly,
  button,
  buttonProps,
  disabled,
  keyboardShortcut = true,
  onCreate,
  onSelect,
}) => {
  const getColor = useLabel()
  const [open, setOpen] = React.useState<boolean>(false)
  const [creating, setCreating] = React.useState<boolean>(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const chipRef = React.useRef<HTMLDivElement>(null)
  const css = useStyles()

  const handleOpen = () => setOpen(!open)
  const handleClose = () => setOpen(false)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === '#') {
      event.preventDefault()
      handleOpen()
    }
  }

  useEffect(() => {
    if (keyboardShortcut) window.addEventListener('keydown', onKeyDown)
    return () => {
      if (keyboardShortcut) window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <>
      {button ? (
        <IconButton
          {...buttonProps}
          ref={buttonRef}
          icon={button}
          loading={creating}
          onClick={handleOpen}
          disabled={open || tags.length === 0 || buttonProps?.disabled || disabled}
          forceTitle
        />
      ) : (
        <Chip
          label={
            <>
              <Icon name={creating ? 'spinner-third' : 'plus'} spin={creating} size="sm" inlineLeft />
              {label}
            </>
          }
          className={css.chip}
          size="small"
          onClick={handleOpen}
          ref={chipRef}
        />
      )}
      <TagAutocomplete
        items={tags}
        open={open}
        indicator="tag"
        hideIcons={hideIcons}
        filter={filter}
        createOnly={createOnly}
        placeholder={placeholder}
        targetEl={buttonRef.current || chipRef.current}
        onItemColor={tag => getColor(tag.color)}
        onClose={handleClose}
        allowAdding={allowAdding}
        InputProps={{
          endAdornment: keyboardShortcut && (
            <Tooltip title="Keyboard shortcut '#'" placement="top" arrow>
              <Chip label="#" size="small" />
            </Tooltip>
          ),
        }}
        onSelect={async (action, tag) => {
          if (action === 'new') {
            setCreating(true)
            await onCreate?.(tag)
            setCreating(false)
          }
          await onSelect?.(tag)
        }}
      />
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  chip: { fontWeight: 500, letterSpacing: 1, color: palette.grayDarker.main },
}))
